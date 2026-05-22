using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NutriPlan.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMealPlanSharing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "canEdit",
                table: "meal_plans",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "inviteCanEdit",
                table: "meal_plans",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "inviteExpiresAt",
                table: "meal_plans",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "inviteToken",
                table: "meal_plans",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "sharedAt",
                table: "meal_plans",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "sharedWithUserId",
                table: "meal_plans",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_meal_plans_inviteToken",
                table: "meal_plans",
                column: "inviteToken",
                unique: true,
                filter: "\"inviteToken\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_meal_plans_sharedWithUserId",
                table: "meal_plans",
                column: "sharedWithUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_meal_plans_users_sharedWithUserId",
                table: "meal_plans",
                column: "sharedWithUserId",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_meal_plans_users_sharedWithUserId",
                table: "meal_plans");

            migrationBuilder.DropIndex(
                name: "IX_meal_plans_inviteToken",
                table: "meal_plans");

            migrationBuilder.DropIndex(
                name: "IX_meal_plans_sharedWithUserId",
                table: "meal_plans");

            migrationBuilder.DropColumn(
                name: "canEdit",
                table: "meal_plans");

            migrationBuilder.DropColumn(
                name: "inviteCanEdit",
                table: "meal_plans");

            migrationBuilder.DropColumn(
                name: "inviteExpiresAt",
                table: "meal_plans");

            migrationBuilder.DropColumn(
                name: "inviteToken",
                table: "meal_plans");

            migrationBuilder.DropColumn(
                name: "sharedAt",
                table: "meal_plans");

            migrationBuilder.DropColumn(
                name: "sharedWithUserId",
                table: "meal_plans");
        }
    }
}
