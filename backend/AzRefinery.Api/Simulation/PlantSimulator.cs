using AzRefinery.Api.Domain.Equipment;
using AzRefinery.Api.Domain.Events;
using AzRefinery.Api.Domain.Sensors;
using AzRefinery.Api.Simulation.DegradationModels;

namespace AzRefinery.Api.Simulation;

public class PlantSimulator
{
    private readonly object _lock = new();
    private readonly Random _random = new();
    private DateTime _lastAdvancedAt;

    public List<Equipment> Equipment { get; private set; } = new();
    public DateTime SimulationTime { get; private set; }
    public DateTime RealStartTime { get; private set; }
    public double TimeAcceleration { get; private set; } = 60.0;
    public bool IsPaused { get; private set; }

    public PlantSimulator()
    {
        Reset();
    }

    public Equipment GetById(string id)
        => Equipment.FirstOrDefault(e => e.Id == id)
           ?? throw new KeyNotFoundException($"Equipment '{id}' not found");

    public void ApplySetpoint(string equipmentId, string name, double value)
    {
        lock (_lock)
        {
            GetById(equipmentId).Setpoints[name] = value;
        }
    }

    public void SetTimeAcceleration(double value)
    {
        if (value < 0.1 || value > 10000)
            throw new ArgumentOutOfRangeException(nameof(value), "TimeAcceleration must be in [0.1, 10000]");
        lock (_lock) TimeAcceleration = value;
    }

    public void Pause() { lock (_lock) IsPaused = true; }
    public void Resume() { lock (_lock) { IsPaused = false; _lastAdvancedAt = DateTime.UtcNow; } }

    public void Reset()
    {
        lock (_lock)
        {
            RealStartTime = DateTime.UtcNow;
            SimulationTime = DateTime.UtcNow;
            _lastAdvancedAt = DateTime.UtcNow;
            IsPaused = false;
            Equipment = BuildPlant();
        }
    }

    /// <summary>Один шаг: realDtSeconds — прошло реального времени с прошлого тика.</summary>
    public void Tick(double realDtSeconds)
    {
        lock (_lock)
        {
            if (IsPaused) return;
            double simDt = realDtSeconds * TimeAcceleration;
            if (simDt <= 0) return;
            SimulationTime = SimulationTime.AddSeconds(simDt);
            var ctx = new SimulationContext
            {
                Dt = simDt,
                SimulationTime = SimulationTime,
                Random = _random
            };
            // Порядок критичен: каждый объект читает выходы предыдущего.
            foreach (var eq in Equipment)
                eq.Tick(ctx);
        }
    }

    /// <summary>Догнать симуляцию до текущего реального момента (используется до выдачи API-ответа и в фоне).</summary>
    public void AdvanceToNow()
    {
        lock (_lock)
        {
            var now = DateTime.UtcNow;
            double real = (now - _lastAdvancedAt).TotalSeconds;
            _lastAdvancedAt = now;
            if (IsPaused) return;
            // Защита от долгих пауз: ограничим один тик 1 секундой реальной.
            real = Math.Min(real, 1.0);
            if (real > 0) Tick(real);
        }
    }

    public void PerformMaintenance(string equipmentId)
    {
        lock (_lock) GetById(equipmentId).PerformMaintenance();
    }

    // ---------- Сборка завода ----------

    private static List<Equipment> BuildPlant()
    {
        var crude = new CrudeTank
        {
            Id = "TANK-CRUDE-01",
            Name = "Резервуар сырой нефти",
            Type = EquipmentType.CrudeTank,
            Setpoints = { ["TARGET_LEVEL"] = 80.0 },
            Sensors =
            {
                MakeSensor("TANK-CRUDE-01", "LEVEL",       SensorType.Level,       "%",  80, 10, 95),
                MakeSensor("TANK-CRUDE-01", "TEMPERATURE", SensorType.Temperature, "°C", 25, 5,  60),
            }
        };

        var pump = new FeedPump
        {
            Id = "PUMP-01",
            Name = "Насос подачи сырья",
            Type = EquipmentType.FeedPump,
            UpstreamTank = crude,
            DegradationModel = new ExponentialDegradation(),
            Setpoints = { ["TARGET_FLOW"] = 150.0 },
            Sensors =
            {
                MakeSensor("PUMP-01", "FLOW_RATE",       SensorType.FlowRate,    "m³/h", 150, 0,   200),
                MakeSensor("PUMP-01", "OUTLET_PRESSURE", SensorType.Pressure,    "bar",  5.0, 0,   8.0),
                MakeSensor("PUMP-01", "BEARING_TEMP",    SensorType.Temperature, "°C",   65,  20,  90),
                MakeSensor("PUMP-01", "VIBRATION",       SensorType.Vibration,   "mm/s", 2.0, 0,   4.5),
                MakeSensor("PUMP-01", "POWER",           SensorType.Power,       "kW",   75,  0,   120),
            }
        };

        var hex = new HeatExchanger
        {
            Id = "HEX-01",
            Name = "Теплообменник",
            Type = EquipmentType.HeatExchanger,
            UpstreamPump = pump,
            DegradationModel = new ExponentialDegradation(),
            Sensors =
            {
                MakeSensor("HEX-01", "INLET_TEMP_COLD",  SensorType.Temperature, "°C", 25,  5,   60),
                MakeSensor("HEX-01", "OUTLET_TEMP_COLD", SensorType.Temperature, "°C", 230, 50,  280),
                MakeSensor("HEX-01", "INLET_TEMP_HOT",   SensorType.Temperature, "°C", 340, 200, 380),
                MakeSensor("HEX-01", "OUTLET_TEMP_HOT",  SensorType.Temperature, "°C", 190, 100, 280),
                MakeSensor("HEX-01", "FLOW_RATE",        SensorType.FlowRate,    "m³/h", 150, 0, 200),
            }
        };

        var col = new DistillationColumn
        {
            Id = "COL-01",
            Name = "Ректификационная колонна",
            Type = EquipmentType.DistillationColumn,
            UpstreamHex = hex,
            Setpoints = { ["REFLUX_FLOW"] = 60.0 },
            Sensors =
            {
                MakeSensor("COL-01", "TOP_TEMP",      SensorType.Temperature, "°C",   130, 80,  220),
                MakeSensor("COL-01", "BOTTOM_TEMP",   SensorType.Temperature, "°C",   350, 250, 400),
                MakeSensor("COL-01", "PRESSURE",      SensorType.Pressure,    "bar",  1.3, 0.8, 2.0),
                MakeSensor("COL-01", "LEVEL",         SensorType.Level,       "%",    50,  10,  90),
                MakeSensor("COL-01", "REFLUX_FLOW",   SensorType.FlowRate,    "m³/h", 60,  20,  100),
                MakeSensor("COL-01", "GASOLINE_DRAW", SensorType.FlowRate,    "m³/h", 45,  0,   80),
                MakeSensor("COL-01", "KEROSENE_DRAW", SensorType.FlowRate,    "m³/h", 38,  0,   60),
                MakeSensor("COL-01", "DIESEL_DRAW",   SensorType.FlowRate,    "m³/h", 38,  0,   60),
                MakeSensor("COL-01", "MAZUT_DRAW",    SensorType.FlowRate,    "m³/h", 30,  0,   50),
            }
        };

        var products = new[]
        {
            ("TANK-GASOLINE-01", "Резервуар бензина", "GASOLINE_DRAW", 35.0),
            ("TANK-KEROSENE-01", "Резервуар керосина","KEROSENE_DRAW", 40.0),
            ("TANK-DIESEL-01",   "Резервуар дизеля",  "DIESEL_DRAW",   45.0),
            ("TANK-MAZUT-01",    "Резервуар мазута",  "MAZUT_DRAW",    60.0),
        };

        var productTanks = products.Select(p => new ProductTank
        {
            Id = p.Item1,
            Name = p.Item2,
            Type = EquipmentType.ProductTank,
            UpstreamColumn = col,
            SourceCode = p.Item3,
            ProductTemperatureC = p.Item4,
            Sensors =
            {
                MakeSensor(p.Item1, "LEVEL",       SensorType.Level,       "%",  30, 0, 95),
                MakeSensor(p.Item1, "TEMPERATURE", SensorType.Temperature, "°C", p.Item4, 10, 90),
            }
        }).Cast<Equipment>().ToList();

        var all = new List<Equipment> { crude, pump, hex, col };
        all.AddRange(productTanks);
        return all;
    }

    private static Sensor MakeSensor(string equipId, string code, SensorType type,
                                     string unit, double nominal, double min, double max)
        => new()
        {
            Id = $"{equipId}-{code}",
            EquipmentId = equipId,
            Code = code,
            Type = type,
            Unit = unit,
            CurrentValue = nominal,
            NominalValue = nominal,
            MinValue = min,
            MaxValue = max,
        };
}
