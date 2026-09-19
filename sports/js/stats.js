/* ==========================================================================
   昨日统计页：人流量 / 高峰期排行表格 + 柱状图 / 折线图 / 饼图
   （jQuery + ECharts + SportsData；同一容器只 init 一次，防止叠影）
   ========================================================================== */
$(function () {
  'use strict';

  var charts = { bar: null, line: null, pie: null };
  var PALETTE = ['#0e7c86', '#f97316', '#2563eb', '#16a34a', '#9333ea', '#dc2626'];

  // 排行表格（按昨日总人流量降序）
  function renderTable(venues) {
    var ranked = venues.map(function (v) {
      return $.extend({}, v, SportsData.statsOf(v));
    }).sort(function (a, b) {
      return b.total - a.total;
    });

    var rows = ranked.map(function (v, i) {
      var rankClass = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : '';
      return [
        '<tr>',
        '  <td><span class="rank-no ' + rankClass + '">', i + 1, '</span></td>',
        '  <td class="text-start fw-semibold"><i class="bi ' + v.icon + ' me-1 text-primary"></i>', v.name, '</td>',
        '  <td>', v.type, '</td>',
        '  <td class="fw-semibold">', v.total.toLocaleString('zh-CN'), '</td>',
        '  <td><span class="peak-tag"><i class="bi bi-clock-history me-1"></i>', v.peakHour, '</span></td>',
        '  <td>', v.peakCount, '</td>',
        '</tr>'
      ].join('');
    }).join('');

    $('#rank-body').html(rows);
    return ranked;
  }

  function initChart(id, existed, option) {
    var chart = existed || echarts.init(document.getElementById(id));
    chart.setOption(option, true);
    return chart;
  }

  // 图 1：昨日总人流量排行柱状图
  function renderBar(ranked) {
    charts.bar = initChart('bar-chart', charts.bar, {
      title: { text: '各场馆昨日总人流量排行', left: 'center', textStyle: { fontSize: 16 } },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' },
        valueFormatter: function (v) { return v + ' 人次'; } },
      grid: { left: 16, right: 24, top: 56, bottom: 40, containLabel: true },
      xAxis: {
        type: 'category',
        data: ranked.map(function (v) { return v.name; }),
        axisLabel: { color: '#54667a' }
      },
      yAxis: {
        type: 'value', name: '人次',
        axisLabel: { color: '#8a98a5' },
        splitLine: { lineStyle: { type: 'dashed' } }
      },
      series: [{
        name: '昨日总人流量',
        type: 'bar',
        barMaxWidth: 44,
        data: ranked.map(function (v, i) {
          return { value: v.total, itemStyle: { color: PALETTE[i % PALETTE.length], borderRadius: [5, 5, 0, 0] } };
        }),
        label: { show: true, position: 'top', color: '#54667a' }
      }]
    });
  }

  // 图 2：分时段人流趋势折线图
  function renderLine(venues) {
    var hours = venues.length ? venues[0].hourlyFlow.map(function (r) { return r.hour; }) : [];

    charts.line = initChart('line-chart', charts.line, {
      title: { text: '昨日分时段人流趋势', left: 'center', textStyle: { fontSize: 16 } },
      tooltip: { trigger: 'axis',
        valueFormatter: function (v) { return v + ' 人'; } },
      legend: { top: 30, type: 'scroll' },
      grid: { left: 12, right: 20, top: 72, bottom: 36, containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: hours, axisLabel: { color: '#8a98a5' } },
      yAxis: { type: 'value', name: '人', axisLabel: { color: '#8a98a5' },
        splitLine: { lineStyle: { type: 'dashed' } } },
      series: venues.map(function (v, i) {
        return {
          name: v.name,
          type: 'line',
          smooth: true,
          symbolSize: 6,
          data: v.hourlyFlow.map(function (r) { return r.count; }),
          lineStyle: { width: 2, color: PALETTE[i % PALETTE.length] },
          itemStyle: { color: PALETTE[i % PALETTE.length] }
        };
      })
    });
  }

  // 图 3：总人流量占比饼图
  function renderPie(ranked) {
    charts.pie = initChart('pie-chart', charts.pie, {
      title: { text: '昨日人流量占比', left: 'center', textStyle: { fontSize: 16 } },
      tooltip: { trigger: 'item', formatter: '{b}<br/>{c} 人次（{d}%）' },
      legend: { bottom: 0, type: 'scroll' },
      color: PALETTE,
      series: [{
        name: '昨日总人流量',
        type: 'pie',
        radius: ['38%', '62%'],
        center: ['50%', '52%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { formatter: '{b}\n{d}%', fontSize: 11 },
        data: ranked.map(function (v) {
          return { name: v.name, value: v.total };
        })
      }]
    });
  }

  SportsData.load('data/data.json').then(function (result) {
    $('#stat-date').text(result.meta.date);
    $('#stat-source').text(result.meta.source);

    if (!result.venues.length) {
      $('#table-empty').removeClass('d-none');
      return;
    }

    var ranked = renderTable(result.venues);
    renderBar(ranked);
    renderLine(result.venues);
    renderPie(ranked);
  });

  // 窗口缩放时所有图表自适应
  window.addEventListener('resize', function () {
    Object.keys(charts).forEach(function (key) {
      if (charts[key]) {
        charts[key].resize();
      }
    });
  });
});
