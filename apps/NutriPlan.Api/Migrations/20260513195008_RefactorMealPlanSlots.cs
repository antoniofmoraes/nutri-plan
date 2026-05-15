using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NutriPlan.Api.Migrations
{
    /// <inheritdoc />
    public partial class RefactorMealPlanSlots : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Destructive: wipe all meal plan data before restructuring
            migrationBuilder.Sql("DELETE FROM meal_plans;");

            migrationBuilder.DropIndex(
                name: "IX_meals_dayPlanId",
                table: "meals");

            migrationBuilder.DropColumn(
                name: "name",
                table: "meals");

            migrationBuilder.DropColumn(
                name: "time",
                table: "meals");

            migrationBuilder.AddColumn<Guid>(
                name: "mealSlotId",
                table: "meals",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "meal_slots",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    time = table.Column<string>(type: "text", nullable: true),
                    sortOrder = table.Column<int>(type: "integer", nullable: false),
                    mealPlanId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_meal_slots", x => x.id);
                    table.ForeignKey(
                        name: "FK_meal_slots_meal_plans_mealPlanId",
                        column: x => x.mealPlanId,
                        principalTable: "meal_plans",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_meals_dayPlanId_mealSlotId",
                table: "meals",
                columns: new[] { "dayPlanId", "mealSlotId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_meals_mealSlotId",
                table: "meals",
                column: "mealSlotId");

            migrationBuilder.CreateIndex(
                name: "IX_meal_slots_mealPlanId",
                table: "meal_slots",
                column: "mealPlanId");

            migrationBuilder.AddForeignKey(
                name: "FK_meals_meal_slots_mealSlotId",
                table: "meals",
                column: "mealSlotId",
                principalTable: "meal_slots",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_meals_meal_slots_mealSlotId",
                table: "meals");

            migrationBuilder.DropTable(
                name: "meal_slots");

            migrationBuilder.DropIndex(
                name: "IX_meals_dayPlanId_mealSlotId",
                table: "meals");

            migrationBuilder.DropIndex(
                name: "IX_meals_mealSlotId",
                table: "meals");

            migrationBuilder.DropColumn(
                name: "mealSlotId",
                table: "meals");

            migrationBuilder.AddColumn<string>(
                name: "name",
                table: "meals",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "time",
                table: "meals",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_meals_dayPlanId",
                table: "meals",
                column: "dayPlanId");
        }
    }
}
