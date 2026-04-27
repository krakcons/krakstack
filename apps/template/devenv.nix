{
  pkgs,
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
    DATABASE_URL = "postgresql://postgres@127.0.0.1:54329/template";
  };

  services.postgres = {
    enable = true;
    package = pkgs.postgresql_18;
    extensions = extensions: [
      extensions.postgis
      extensions.pgvector
    ];
    initialDatabases = [
      { name = "template"; }
    ];
  };
}
