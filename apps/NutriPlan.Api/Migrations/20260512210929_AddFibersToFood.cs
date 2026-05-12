using System.Reflection;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NutriPlan.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddFibersToFood : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "fibers",
                table: "foods",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.Sql("ALTER TABLE foods ALTER COLUMN id SET DEFAULT gen_random_uuid();");

            migrationBuilder.Sql("DELETE FROM foods;");

            using var stream = Assembly.GetExecutingAssembly()
                .GetManifestResourceStream("NutriPlan.Api.Migrations.seed_foods_tbca.sql")!;
            using var reader = new StreamReader(stream);
            var sql = reader.ReadToEnd()
                .Replace("BEGIN;", "")
                .Replace("COMMIT;", "");
            migrationBuilder.Sql(sql);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "fibers",
                table: "foods");
        }
    }
}
