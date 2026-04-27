{
  pkgs,
  config,
  ...
}:
{
  languages.javascript = {
    enable = true;
    bun = {
      enable = true;
      install.enable = true;
    };
  };

  env = {
    DATABASE_URL = "postgresql://postgres:postgres@localhost:${toString config.services.postgres.port}/dev";
  };

  services.postgres = {
    enable = true;
    package = pkgs.postgresql_18;
    extensions = extensions: [
      extensions.postgis
      extensions.pgvector
    ];
    listen_addresses = "127.0.0.1";
    initialDatabases = [
      {
        name = "dev";
        user = "postgres";
        pass = "postgres";
      }
    ];
  };

  processes = {
    vite.exec = "bun run dev";
    drizzle.exec = "bunx drizzle-kit studio";
  };
}
