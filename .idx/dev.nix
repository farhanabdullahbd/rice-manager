# Project IDX configuration for POS System
{ pkgs, ... }: {
  channel = "stable-24.05";

  packages = [
    pkgs.nodejs_20
    pkgs.nodePackages.npm
  ];

  idx.extensions = [
    "esbenp.prettier-vscode"
    "dbaeumer.vscode-eslint"
    "Prisma.prisma"
  ];

  idx.workspace.onCreate = {
    setup = {
      openFiles = [ "README.md" ];
    };
  };

  idx.previews = {
    enable = true;
    previews = {
      web = {
        command = [
          "node"
          "backend/src/app.js"
        ];
        manager = "web";
        env = {
          PORT = "$PORT";
          DATABASE_URL = "file:./backend/prisma/pos.db";
          JWT_SECRET = "pos-secret-key-2024";
          JWT_EXPIRES_IN = "7d";
          NODE_ENV = "development";
        };
      };
    };
  };
}
