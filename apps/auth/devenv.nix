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
    DATABASE_URL = "postgresql://postgres:postgres@localhost:${toString config.services.postgres.port}/krakstack_auth";
    BETTER_AUTH_SECRET = "development-secret-that-is-long-enough-for-local-dev";
    BETTER_AUTH_URL = "http://localhost:3001";
    BETTER_AUTH_TRUSTED_ORIGINS = "http://localhost:3001,http://localhost:3000";
    BETTER_AUTH_VALID_AUDIENCES = "http://localhost:3001,http://localhost:3000";
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
        name = "krakstack_auth";
        user = "postgres";
        pass = "postgres";
      }
    ];
  };

  processes = {
    vite.exec = "bun run dev";
  };
}
