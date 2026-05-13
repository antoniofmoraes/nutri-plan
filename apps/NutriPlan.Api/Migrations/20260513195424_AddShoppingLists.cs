using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NutriPlan.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddShoppingLists : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "shopping_lists",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    ownerId = table.Column<Guid>(type: "uuid", nullable: false),
                    inviteToken = table.Column<string>(type: "text", nullable: true),
                    inviteExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_shopping_lists", x => x.id);
                    table.ForeignKey(
                        name: "FK_shopping_lists_users_ownerId",
                        column: x => x.ownerId,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "shopping_list_meals",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    shoppingListId = table.Column<Guid>(type: "uuid", nullable: false),
                    mealId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_shopping_list_meals", x => x.id);
                    table.ForeignKey(
                        name: "FK_shopping_list_meals_meals_mealId",
                        column: x => x.mealId,
                        principalTable: "meals",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_shopping_list_meals_shopping_lists_shoppingListId",
                        column: x => x.shoppingListId,
                        principalTable: "shopping_lists",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "shopping_list_members",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    shoppingListId = table.Column<Guid>(type: "uuid", nullable: false),
                    userId = table.Column<Guid>(type: "uuid", nullable: false),
                    joinedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_shopping_list_members", x => x.id);
                    table.ForeignKey(
                        name: "FK_shopping_list_members_shopping_lists_shoppingListId",
                        column: x => x.shoppingListId,
                        principalTable: "shopping_lists",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_shopping_list_members_users_userId",
                        column: x => x.userId,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_shopping_list_meals_mealId",
                table: "shopping_list_meals",
                column: "mealId");

            migrationBuilder.CreateIndex(
                name: "IX_shopping_list_meals_shoppingListId_mealId",
                table: "shopping_list_meals",
                columns: new[] { "shoppingListId", "mealId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_shopping_list_members_shoppingListId_userId",
                table: "shopping_list_members",
                columns: new[] { "shoppingListId", "userId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_shopping_list_members_userId",
                table: "shopping_list_members",
                column: "userId");

            migrationBuilder.CreateIndex(
                name: "IX_shopping_lists_inviteToken",
                table: "shopping_lists",
                column: "inviteToken",
                unique: true,
                filter: "\"inviteToken\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_shopping_lists_ownerId",
                table: "shopping_lists",
                column: "ownerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "shopping_list_meals");

            migrationBuilder.DropTable(
                name: "shopping_list_members");

            migrationBuilder.DropTable(
                name: "shopping_lists");
        }
    }
}
