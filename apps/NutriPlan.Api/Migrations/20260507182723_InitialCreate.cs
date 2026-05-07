using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NutriPlan.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "foods",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    calories = table.Column<double>(type: "double precision", nullable: false),
                    protein = table.Column<double>(type: "double precision", nullable: false),
                    carbs = table.Column<double>(type: "double precision", nullable: false),
                    fat = table.Column<double>(type: "double precision", nullable: false),
                    portion = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_foods", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    email = table.Column<string>(type: "text", nullable: false),
                    password = table.Column<string>(type: "text", nullable: false),
                    googleId = table.Column<string>(type: "text", nullable: true),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "meal_plans",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    goal = table.Column<string>(type: "text", nullable: false),
                    dailyCalories = table.Column<int>(type: "integer", nullable: false),
                    dailyProtein = table.Column<int>(type: "integer", nullable: true),
                    dailyCarbs = table.Column<int>(type: "integer", nullable: true),
                    dailyFat = table.Column<int>(type: "integer", nullable: true),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    userId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_meal_plans", x => x.id);
                    table.ForeignKey(
                        name: "FK_meal_plans_users_userId",
                        column: x => x.userId,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "day_plans",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    day = table.Column<string>(type: "text", nullable: false),
                    mealPlanId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_day_plans", x => x.id);
                    table.ForeignKey(
                        name: "FK_day_plans_meal_plans_mealPlanId",
                        column: x => x.mealPlanId,
                        principalTable: "meal_plans",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "meals",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    time = table.Column<string>(type: "text", nullable: true),
                    dayPlanId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_meals", x => x.id);
                    table.ForeignKey(
                        name: "FK_meals_day_plans_dayPlanId",
                        column: x => x.dayPlanId,
                        principalTable: "day_plans",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "meal_foods",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    quantity = table.Column<double>(type: "double precision", nullable: false),
                    mealId = table.Column<Guid>(type: "uuid", nullable: false),
                    foodId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_meal_foods", x => x.id);
                    table.ForeignKey(
                        name: "FK_meal_foods_foods_foodId",
                        column: x => x.foodId,
                        principalTable: "foods",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_meal_foods_meals_mealId",
                        column: x => x.mealId,
                        principalTable: "meals",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_day_plans_mealPlanId_day",
                table: "day_plans",
                columns: new[] { "mealPlanId", "day" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_meal_foods_foodId",
                table: "meal_foods",
                column: "foodId");

            migrationBuilder.CreateIndex(
                name: "IX_meal_foods_mealId_foodId",
                table: "meal_foods",
                columns: new[] { "mealId", "foodId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_meal_plans_userId",
                table: "meal_plans",
                column: "userId");

            migrationBuilder.CreateIndex(
                name: "IX_meals_dayPlanId",
                table: "meals",
                column: "dayPlanId");

            migrationBuilder.CreateIndex(
                name: "IX_users_email",
                table: "users",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_googleId",
                table: "users",
                column: "googleId",
                unique: true,
                filter: "\"googleId\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "meal_foods");

            migrationBuilder.DropTable(
                name: "foods");

            migrationBuilder.DropTable(
                name: "meals");

            migrationBuilder.DropTable(
                name: "day_plans");

            migrationBuilder.DropTable(
                name: "meal_plans");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}
