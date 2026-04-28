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
    DATABASE_URL = "postgresql://postgres:postgres@localhost:${toString config.services.postgres.port}/site";
    BETTER_AUTH_URL = "http://localhost:3000";
    BETTER_AUTH_SECRET = "SCwlfJUMci/lwEwFWex/ductuMdPbta33MVIVuxGbcE=";
  };

  services.postgres = {
    enable = true;
    port = 5432;
    package = pkgs.postgresql_18;
    extensions = extensions: [
      extensions.postgis
      extensions.pgvector
    ];
    listen_addresses = "127.0.0.1";
    initialDatabases = [
      {
        name = "site";
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
