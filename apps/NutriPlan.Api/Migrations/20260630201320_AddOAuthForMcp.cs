using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NutriPlan.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddOAuthForMcp : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "oauth_access_tokens",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tokenHash = table.Column<string>(type: "text", nullable: false),
                    clientId = table.Column<string>(type: "text", nullable: false),
                    userId = table.Column<Guid>(type: "uuid", nullable: false),
                    scope = table.Column<string>(type: "text", nullable: false),
                    expiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    revokedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_oauth_access_tokens", x => x.id);
                    table.ForeignKey(
                        name: "FK_oauth_access_tokens_users_userId",
                        column: x => x.userId,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "oauth_authorization_codes",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    codeHash = table.Column<string>(type: "text", nullable: false),
                    clientId = table.Column<string>(type: "text", nullable: false),
                    userId = table.Column<Guid>(type: "uuid", nullable: false),
                    redirectUri = table.Column<string>(type: "text", nullable: false),
                    scope = table.Column<string>(type: "text", nullable: false),
                    codeChallenge = table.Column<string>(type: "text", nullable: false),
                    codeChallengeMethod = table.Column<string>(type: "text", nullable: false),
                    expiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    usedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_oauth_authorization_codes", x => x.id);
                    table.ForeignKey(
                        name: "FK_oauth_authorization_codes_users_userId",
                        column: x => x.userId,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "oauth_clients",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    clientId = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    redirectUris = table.Column<string>(type: "text", nullable: false),
                    allowedScopes = table.Column<string>(type: "text", nullable: false),
                    isEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_oauth_clients", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_oauth_access_tokens_tokenHash",
                table: "oauth_access_tokens",
                column: "tokenHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_oauth_access_tokens_userId",
                table: "oauth_access_tokens",
                column: "userId");

            migrationBuilder.CreateIndex(
                name: "IX_oauth_authorization_codes_codeHash",
                table: "oauth_authorization_codes",
                column: "codeHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_oauth_authorization_codes_userId",
                table: "oauth_authorization_codes",
                column: "userId");

            migrationBuilder.CreateIndex(
                name: "IX_oauth_clients_clientId",
                table: "oauth_clients",
                column: "clientId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "oauth_access_tokens");

            migrationBuilder.DropTable(
                name: "oauth_authorization_codes");

            migrationBuilder.DropTable(
                name: "oauth_clients");
        }
    }
}
