using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NutriPlan.Api.Migrations
{
    /// <inheritdoc />
    public partial class RenameIsFreeToIsCheat : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "isFree",
                table: "meals",
                newName: "isCheat");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "isCheat",
                table: "meals",
                newName: "isFree");
        }
    }
}
