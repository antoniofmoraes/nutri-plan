using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NutriPlan.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddOAuthRefreshTokens : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "refreshExpiresAt",
                table: "oauth_access_tokens",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "refreshTokenHash",
                table: "oauth_access_tokens",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_oauth_access_tokens_refreshTokenHash",
                table: "oauth_access_tokens",
                column: "refreshTokenHash",
                unique: true,
                filter: "\"refreshTokenHash\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_oauth_access_tokens_refreshTokenHash",
                table: "oauth_access_tokens");

            migrationBuilder.DropColumn(
                name: "refreshExpiresAt",
                table: "oauth_access_tokens");

            migrationBuilder.DropColumn(
                name: "refreshTokenHash",
                table: "oauth_access_tokens");
        }
    }
}
