using System.Net;
using System.Text.Json;
using NutriPlan.Api.DTOs;

namespace NutriPlan.Api.Middleware;

public class ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (ApiException ex)
        {
            context.Response.StatusCode = ex.StatusCode;
            context.Response.ContentType = "application/json";
            var response = new ApiResponse(false, Error: ex.Message, Details: ex.Details);
            await context.Response.WriteAsync(JsonSerializer.Serialize(response, JsonOptions));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception");
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            context.Response.ContentType = "application/json";
            var response = new ApiResponse(false, Error: "Erro interno do servidor");
            await context.Response.WriteAsync(JsonSerializer.Serialize(response, JsonOptions));
        }
    }
}

public class ApiException(string message, int statusCode, List<FieldError>? details = null) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
    public List<FieldError>? Details { get; } = details;
}
