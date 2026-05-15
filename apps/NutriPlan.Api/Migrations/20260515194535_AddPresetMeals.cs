using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NutriPlan.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPresetMeals : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "preset_meals",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    userId = table.Column<Guid>(type: "uuid", nullable: false),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_preset_meals", x => x.id);
                    table.ForeignKey(
                        name: "FK_preset_meals_users_userId",
                        column: x => x.userId,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "preset_meal_foods",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    quantity = table.Column<double>(type: "double precision", nullable: false),
                    presetMealId = table.Column<Guid>(type: "uuid", nullable: false),
                    foodId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_preset_meal_foods", x => x.id);
                    table.ForeignKey(
                        name: "FK_preset_meal_foods_foods_foodId",
                        column: x => x.foodId,
                        principalTable: "foods",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_preset_meal_foods_preset_meals_presetMealId",
                        column: x => x.presetMealId,
                        principalTable: "preset_meals",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_preset_meal_foods_foodId",
                table: "preset_meal_foods",
                column: "foodId");

            migrationBuilder.CreateIndex(
                name: "IX_preset_meal_foods_presetMealId_foodId",
                table: "preset_meal_foods",
                columns: new[] { "presetMealId", "foodId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_preset_meals_userId",
                table: "preset_meals",
                column: "userId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "preset_meal_foods");

            migrationBuilder.DropTable(
                name: "preset_meals");
        }
    }
}
