using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NutriPlan.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddIsFreeToMeal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "isFree",
                table: "meals",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "isFree",
                table: "meals");
        }
    }
}
