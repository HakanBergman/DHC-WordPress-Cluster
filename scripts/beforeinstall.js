var wpbfp = '${settings.wp_protect}' == 'true' ? "THROTTLE" : "OFF";

var resp = {
  result: 0,
  ssl: !!jelastic.billing.account.GetQuotas('environment.jelasticssl.enabled').array[0].value,
  nodes: [{
    nodeType: "storage",
    flexibleCloudlets: ${settings.st_flexibleCloudlets:1},
    fixedCloudlets: ${settings.st_fixedCloudlets:1},
    diskLimit: ${settings.st_diskLimit:5},
    nodeGroup: "storage",
    displayName: "DHC Storage"
  }]
}

if (${settings.galera:false}) {
  resp.nodes.push({
    nodeType: "mariadb-dockerized",
    tag: "10.3.20",
    count: 1,
    flexibleCloudlets: ${settings.db_flexibleCloudlets:1},
    fixedCloudlets: ${settings.db_fixedCloudlets:1},
    diskLimit: ${settings.db_diskLimit:5},
    nodeGroup: "sqldb",
    displayName: "DHC MariaDB Cluster",
    restartDelay: 5,
    skipNodeEmails: true,
    env: {
      ON_ENV_INSTALL: "",
      JELASTIC_PORTS: "4567,4568,4444"
    }
  })
}

if (!${settings.galera:false}) {
  resp.nodes.push({
    nodeType: "mariadb-dockerized",
    tag: "10.3.20",
    count: 1,
    flexibleCloudlets: ${settings.db_flexibleCloudlets:1},
    fixedCloudlets: ${settings.db_fixedCloudlets:1},
    diskLimit: ${settings.db_diskLimit:5},
    nodeGroup: "sqldb",
    skipNodeEmails: true,
    displayName: "MariaDB Server"
  })
}

if (${settings.ls-addon:false}) {
  resp.nodes.push({
    nodeType: "litespeedadc",
    tag: "2.5.1",
    count: 1,
    flexibleCloudlets: ${settings.bl_flexibleCloudlets:1},
    fixedCloudlets: ${settings.bl_fixedCloudlets:1},
    diskLimit: ${settings.bl_diskLimit:5},
    nodeGroup: "bl",
    scalingMode: "STATEFUL",
    displayName: "DHC Load Balancer",
    env: {
      WP_PROTECT: wpbfp,
      WP_PROTECT_LIMIT: 10
    }
  }, {
    nodeType: "litespeedphp",
    tag: "5.4.6-php-7.4.3",
    count: ${settings.cp_count:1},
    flexibleCloudlets: ${settings.cp_flexibleCloudlets:1},
    fixedCloudlets: ${settings.cp_fixedCloudlets:1},
    diskLimit: ${settings.cp_diskLimit:5},
    nodeGroup: "cp",
    scalingMode: "STATELESS",
    displayName: "DHC WordPress",
    env: {
      SERVER_WEBROOT: "/mnt/www",
      REDIS_ENABLED: "true",
      WAF: "${settings.waf:false}",
      WP_PROTECT: "OFF"
    },
    volumes: [
      "/mnt/www/default"
    ],  
    volumeMounts: {
      "/mnt/www/default": {
        readOnly: "false",
        sourcePath: "/data/ROOT",
        sourceNodeGroup: "storage"
      }
    }
  })
}

if (!${settings.ls-addon:false}) {
  resp.nodes.push({
    nodeType: "nginx-dockerized",
    tag: "1.16.0",
    count: 1,
    flexibleCloudlets: ${settings.bl_flexibleCloudlets:1},
    fixedCloudlets: ${settings.bl_fixedCloudlets:1},
    diskLimit: ${settings.bl_diskLimit:5},
    nodeGroup: "bl",
    scalingMode: "STATEFUL",
    displayName: "DHC Load Balancer"
  }, {
    nodeType: "nginxphp-dockerized",
    tag: "1.16.0-php-7.3.8",
    count: ${settings.cp_count:1},
    flexibleCloudlets: ${settings.cp_flexibleCloudlets:1},                  
    fixedCloudlets: ${settings.cp_fixedCloudlets:1},
    diskLimit: ${settings.cp_diskLimit:5},
    nodeGroup: "cp",
    scalingMode: "STATELESS",
    displayName: "DHC WordPress",
    env: {
      SERVER_WEBROOT: "/mnt/www/default",
      REDIS_ENABLED: "true"
    },
    volumes: [
      "/mnt/www/default",
      "/mnt/www/.cache",
      "/etc/nginx/conf.d/SITES_ENABLED"
    ],  
    volumeMounts: {
      "/mnt/www/default": {
        readOnly: "false",
        sourcePath: "/data/ROOT",
        sourceNodeGroup: "storage"
      },
      "/mnt/www/.cache": {
        readOnly: "false",
        sourcePath: "/data/.cache",
        sourceNodeGroup: "storage"
      },
      "/etc/nginx/conf.d/SITES_ENABLED": {
        readOnly: "false",
        sourcePath: "/data/APP_CONFIGS",
        sourceNodeGroup: "storage"
      }
    }
  })
}

return resp;
