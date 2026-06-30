using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NutriPlan.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMcpMealPlanAccess : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "mcp_meal_plan_accesses",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    userId = table.Column<Guid>(type: "uuid", nullable: false),
                    mealPlanId = table.Column<Guid>(type: "uuid", nullable: false),
                    canRead = table.Column<bool>(type: "boolean", nullable: false),
                    canEdit = table.Column<bool>(type: "boolean", nullable: false),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_mcp_meal_plan_accesses", x => x.id);
                    table.ForeignKey(
                        name: "FK_mcp_meal_plan_accesses_meal_plans_mealPlanId",
                        column: x => x.mealPlanId,
                        principalTable: "meal_plans",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_mcp_meal_plan_accesses_users_userId",
                        column: x => x.userId,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_mcp_meal_plan_accesses_mealPlanId",
                table: "mcp_meal_plan_accesses",
                column: "mealPlanId");

            migrationBuilder.CreateIndex(
                name: "IX_mcp_meal_plan_accesses_userId_mealPlanId",
                table: "mcp_meal_plan_accesses",
                columns: new[] { "userId", "mealPlanId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "mcp_meal_plan_accesses");
        }
    }
}
