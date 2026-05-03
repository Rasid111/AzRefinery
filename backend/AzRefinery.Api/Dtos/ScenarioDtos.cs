using AzRefinery.Api.Scenarios;

namespace AzRefinery.Api.Dtos;

public record ScenarioDto(
    string Name,
    string DisplayName,
    string Description,
    string TargetEquipmentId,
    bool IsActive)
{
    public static ScenarioDto From(IScenario s, bool isActive) =>
        new(s.Name, s.DisplayName, s.Description, s.TargetEquipmentId, isActive);
}
