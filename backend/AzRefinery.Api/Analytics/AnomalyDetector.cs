using System.Collections.Concurrent;
using AzRefinery.Api.Analytics.Models;
using AzRefinery.Api.Domain.Events;

namespace AzRefinery.Api.Analytics;

/// <summary>
/// Скользящее окно по отсчётам, Z-score детектор аномалий.
/// Окно фиксировано в отсчётах (60), не во времени — при изменении TimeAcceleration не пересчитывается.
/// </summary>
public class AnomalyDetector
{
    private const int WindowSize = 60;
    private const double WarningZ = 3.0;
    private const double CriticalZ = 5.0;
    private const int MinSamplesForDetection = 20;

    private readonly ConcurrentDictionary<string, RingBuffer> _buffers = new();

    public AnomalyResult Check(string sensorId, double value)
    {
        var buf = _buffers.GetOrAdd(sensorId, _ => new RingBuffer(WindowSize));
        var (mean, std, count) = buf.Stats();

        AnomalyResult result;
        if (count < MinSamplesForDetection || std < 1e-9)
        {
            result = AnomalyResult.None with { Mean = mean, StdDev = std };
        }
        else
        {
            var z = (value - mean) / std;
            var absZ = Math.Abs(z);
            if (absZ >= CriticalZ)
                result = new AnomalyResult(true, z, mean, std, AnomalySeverity.Critical);
            else if (absZ >= WarningZ)
                result = new AnomalyResult(true, z, mean, std, AnomalySeverity.Warning);
            else
                result = new AnomalyResult(false, z, mean, std, AnomalySeverity.Info);
        }

        buf.Push(value);
        return result;
    }

    public void Reset() => _buffers.Clear();

    private sealed class RingBuffer
    {
        private readonly double[] _data;
        private int _idx;
        private int _count;
        private readonly object _lock = new();

        public RingBuffer(int capacity) => _data = new double[capacity];

        public void Push(double v)
        {
            lock (_lock)
            {
                _data[_idx] = v;
                _idx = (_idx + 1) % _data.Length;
                if (_count < _data.Length) _count++;
            }
        }

        public (double Mean, double StdDev, int Count) Stats()
        {
            lock (_lock)
            {
                if (_count == 0) return (0, 0, 0);
                double sum = 0;
                for (int i = 0; i < _count; i++) sum += _data[i];
                var mean = sum / _count;
                if (_count == 1) return (mean, 0, 1);
                double sq = 0;
                for (int i = 0; i < _count; i++)
                {
                    var d = _data[i] - mean;
                    sq += d * d;
                }
                return (mean, Math.Sqrt(sq / (_count - 1)), _count);
            }
        }
    }
}
