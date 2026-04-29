{
  pkgs,
  ...
}:
{
  dotenv.enable = true;
  languages.javascript = {
    enable = true;
    bun = {
      enable = true;
      install.enable = true;
    };
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
