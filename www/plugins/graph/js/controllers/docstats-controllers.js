
angular.module('cesium.graph.docstats.controllers', ['chart.js', 'cesium.graph.services', 'cesium.graph.common.controllers'])

  .config(function($stateProvider, PluginServiceProvider, csConfig) {
    'ngInject';

    $stateProvider
      .state('app.doc_stats_lg', {
        url: "/data/stats?stepUnit&t&hide&scale",
        views: {
          'menuContent': {
            templateUrl: "plugins/graph/templates/docstats/view_stats.html",
            controller: 'GpDocStatsCtrl'
          }
        }
      });

    var enable = csConfig.plugins && csConfig.plugins.es;
    if (enable) {
      // TODO: add buttons to link with doc stats
    }
  })


  .controller('GpDocStatsCtrl', GpDocStatsController)
;

function GpDocStatsController($scope, $state, $controller, $q, $translate, gpColor, gpData, $filter) {
  'ngInject';

  // Initialize the super class and extend it.
  angular.extend(this, $controller('GpCurrencyAbstractCtrl', {$scope: $scope}));

  $scope.hiddenDatasets = [];

  $scope.chartIdPrefix = 'docstats-chart-';
  $scope.charts = [

    // User count
    {
      id: 'user',
      title: 'GRAPH.DOC_STATS.USER.TITLE',
      series: [
        {
          key: 'user_profile',
          label: 'GRAPH.DOC_STATS.USER.USER_PROFILE',
          color: gpColor.rgba.royal(),
          pointHoverBackgroundColor: gpColor.rgba.royal(),
          clickState: {
            name: 'app.document_search',
            params: {index:'user', type: 'profile'}
          }
        },
        {
          key: 'user_settings',
          label: 'GRAPH.DOC_STATS.USER.USER_SETTINGS',
          color: gpColor.rgba.gray(0.5),
          pointHoverBackgroundColor: gpColor.rgba.gray(),
          clickState: {
            name: 'app.document_search',
            params: {index:'user', type: 'settings'}
          }
        }
      ]
    },

    // Message & Co.
    {
      id: 'message',
      title: 'GRAPH.DOC_STATS.MESSAGE.TITLE',
      series: [
        {
          key: 'message_inbox',
          label: 'GRAPH.DOC_STATS.MESSAGE.MESSAGE_INBOX',
          color: gpColor.rgba.royal(),
          pointHoverBackgroundColor: gpColor.rgba.royal(),
          clickState: {
            name: 'app.document_search',
            params: {index:'message', type: 'inbox'}
          }
        },
        {
          key: 'message_outbox',
          label: 'GRAPH.DOC_STATS.MESSAGE.MESSAGE_OUTBOX',
          color: gpColor.rgba.calm(),
          pointHoverBackgroundColor: gpColor.rgba.calm(),
          clickState: {
            name: 'app.document_search',
            params: {index:'message', type: 'outbox'}
          }
        },
        {
          key: 'invitation_certification',
          label: 'GRAPH.DOC_STATS.MESSAGE.INVITATION_CERTIFICATION',
          color: gpColor.rgba.gray(0.5),
          pointHoverBackgroundColor: gpColor.rgba.gray(),
          clickState: {
            name: 'app.document_search',
            params: {index:'invitation', type: 'certification'}
          }
        }
      ]
    },

    // Social Page & group
    {
      id: 'social',
      title: 'GRAPH.DOC_STATS.SOCIAL.TITLE',
      series: [
        {
          key: 'page_record',
          label: 'GRAPH.DOC_STATS.SOCIAL.PAGE_RECORD',
          color: gpColor.rgba.royal(),
          pointHoverBackgroundColor: gpColor.rgba.royal(),
          clickState: {
            name: 'app.document_search',
            params: {index:'page', type: 'record'}
          }
        },
        {
          key: 'group_record',
          label: 'GRAPH.DOC_STATS.SOCIAL.GROUP_RECORD',
          color: gpColor.rgba.calm(),
          pointHoverBackgroundColor: gpColor.rgba.calm(),
          clickState: {
            name: 'app.document_search',
            params: {index:'group', type: 'record'}
          }
        },
        {
          key: 'page_comment',
          label: 'GRAPH.DOC_STATS.SOCIAL.PAGE_COMMENT',
          color: gpColor.rgba.gray(0.5),
          pointHoverBackgroundColor: gpColor.rgba.gray(),
          clickState: {
            name: 'app.document_search',
            params: {index:'page', type: 'comment'}
          }
        }
      ]
    },

    // Other: deletion, doc, etc.
    {
      id: 'other',
      title: 'GRAPH.DOC_STATS.OTHER.TITLE',
      series: [
        {
          key: 'history_delete',
          label: 'GRAPH.DOC_STATS.OTHER.HISTORY_DELETE',
          color: gpColor.rgba.gray(0.5),
          pointHoverBackgroundColor: gpColor.rgba.gray(),
          clickState: {
            name: 'app.document_search',
            params: {index:'history', type: 'delete'}
          }
        }
      ]
    }
  ];

  var formatInteger = $filter('formatInteger');

  $scope.defaultChartOptions = {
    responsive: true,
    maintainAspectRatio: $scope.maintainAspectRatio,
    title: {
      display: true
    },
    legend: {
      display: true,
      onClick: $scope.onLegendClick
    },
    scales: {
      xAxes: [{
        stacked: true
      }],
      yAxes: [
        {
          stacked: true,
          id: 'y-axis'
        }
      ]
    },
    tooltips: {
      enabled: true,
      mode: 'index',
      callbacks: {
        label: function(tooltipItems, data) {
          return data.datasets[tooltipItems.datasetIndex].label +
            ': ' + formatInteger(tooltipItems.yLabel);
        }
      }
    }
  };

  $scope.init = function(e, state) {
    if (state && state.stateParams) {
      // Manage URL parameters
    }
  };

  $scope.load = function(updateTimePct) {

    return $q.all([
      // Get i18n keys (chart title, series labels, date patterns)
      $translate($scope.charts.reduce(function(res, chart) {
        return res.concat(chart.series.reduce(function(res, serie) {
          return res.concat(serie.label);
        }, [chart.title]));
      }, [
        'COMMON.DATE_PATTERN',
        'COMMON.DATE_SHORT_PATTERN',
        'COMMON.DATE_MONTH_YEAR_PATTERN'
      ])),

      // get Data
      gpData.docstat.get($scope.formData)
    ])
    .then(function(result) {
      var translations = result[0];
      var datePatterns = {
        hour: translations['COMMON.DATE_PATTERN'],
        day: translations['COMMON.DATE_SHORT_PATTERN'],
        month: translations['COMMON.DATE_MONTH_YEAR_PATTERN']
      };

      result = result[1];
      if (!result || !result.times) return; // no data
      $scope.times = result.times;

      // Labels
      var labelPattern = datePatterns[$scope.formData.rangeDuration];
      $scope.labels = result.times.reduce(function(res, time) {
        return res.concat(moment.unix(time).local().format(labelPattern));
      }, []);

      // Update range options with received values
      $scope.updateRange(result.times[0], result.times[result.times.length-1], updateTimePct);

      $scope.setScale($scope.scale);

      // For each chart
      _.forEach($scope.charts, function(chart){

        // Data
        chart.data = [];
        _.forEach(chart.series, function(serie){
          chart.data.push(result[serie.key]||[]);
        });

        // Options (with title)
        chart.options = angular.copy($scope.defaultChartOptions);
        chart.options.title.text = translations[chart.title];

        // Series datasets
        chart.datasetOverride = chart.series.reduce(function(res, serie) {
          return res.concat({
            yAxisID: 'y-axis',
            type: serie.type || 'line',
            label: translations[serie.label],
            fill: true,
            borderWidth: 2,
            pointRadius: 0,
            pointHitRadius: 4,
            pointHoverRadius: 3,
            borderColor: serie.color,
            backgroundColor: serie.color,
            pointBackgroundColor: serie.color,
            pointBorderColor: serie.color,
            pointHoverBackgroundColor: serie.pointHoverBackgroundColor||serie.color,
            pointHoverBorderColor: serie.pointHoverBorderColor||gpColor.rgba.white()
          });
        }, []);
      });
    });

  };

  $scope.onChartClick = function(data, e, item) {
    if (!item) return;
    var chart = _.find($scope.charts , function(chart) {
      return ($scope.chartIdPrefix  + chart.id) == item._chart.canvas.id;
    });

    var serie = chart.series[item._datasetIndex];

    if (serie && serie.clickState && serie.clickState.name) {
      var stateParams = serie.clickState.params ? angular.copy(serie.clickState.params) : {};

      // Compute query
      var from = $scope.times[item._index];
      var to = moment.unix(from).utc().add(1, $scope.formData.rangeDuration).unix();
      stateParams.q = 'time:>={0} AND time:<{1}'.format(from, to);

      return $state.go(serie.clickState.name, stateParams);
    }
    else {
      console.debug('Click on item index={0} on range [{1},{2}]'.format(item._index, from, to));
    }
  };


}
