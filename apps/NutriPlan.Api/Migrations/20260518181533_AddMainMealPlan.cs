using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NutriPlan.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMainMealPlan : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "mainMealPlanId",
                table: "users",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_mainMealPlanId",
                table: "users",
                column: "mainMealPlanId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_users_meal_plans_mainMealPlanId",
                table: "users",
                column: "mainMealPlanId",
                principalTable: "meal_plans",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_users_meal_plans_mainMealPlanId",
                table: "users");

            migrationBuilder.DropIndex(
                name: "IX_users_mainMealPlanId",
                table: "users");

            migrationBuilder.DropColumn(
                name: "mainMealPlanId",
                table: "users");
        }
    }
}
