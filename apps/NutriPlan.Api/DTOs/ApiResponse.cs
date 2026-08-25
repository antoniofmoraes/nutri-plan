namespace NutriPlan.Api.DTOs;

public record ApiResponse<T>(bool Success, T? Data = default, string? Error = null, string? Message = null, List<FieldError>? Details = null, Guid? UndoToken = null);

public record ApiResponse(bool Success, string? Error = null, string? Message = null, List<FieldError>? Details = null, Guid? UndoToken = null);

public record FieldError(string Field, string Message);

public static class ApiResponses
{
    public static ApiResponse<T> Ok<T>(T data) => new(true, data);
    public static ApiResponse<T> Ok<T>(T data, Guid? undoToken) => new(true, data, UndoToken: undoToken);
    public static ApiResponse Ok(string message) => new(true, Message: message);
    public static ApiResponse Ok(string message, Guid? undoToken) => new(true, Message: message, UndoToken: undoToken);
    public static ApiResponse Error(string error, List<FieldError>? details = null) => new(false, Error: error, Details: details);
}
