/* ==========================================================================
   场馆查询页：名称搜索 + 类型 / 拥挤状态即时筛选（jQuery + SportsData）
   ========================================================================== */
$(function () {
  'use strict';

  var venues = [];

  function venueCardHtml(v) {
    var level = SportsData.levelOf(v);
    var rate = Math.round((v.current / v.capacity) * 100);

    return [
      '<div class="col-md-6">',
      '  <div class="card venue-card rate-' + level.key + '">',
      '    <div class="card-body">',
      '      <div class="venue-head">',
      '        <h5 class="venue-name"><span class="venue-icon"><i class="bi ' + v.icon + '"></i></span>', v.name, '</h5>',
      '        <span class="badge level-badge ' + level.badge + '">', level.text, '</span>',
      '      </div>',
      '      <div class="venue-count">', v.current, ' <small>/ ', v.capacity, ' 人</small></div>',
      '      <div class="progress mt-2" role="progressbar" aria-valuenow="', rate,
      '" aria-valuemin="0" aria-valuemax="100">',
      '        <div class="progress-bar" style="width:', rate, '%"></div>',
      '      </div>',
      '      <p class="venue-meta mb-0"><i class="bi bi-clock"></i>', v.openHours,
      '        <span class="ms-3"><i class="bi bi-geo-alt"></i>', v.type, '</span>',
      '        <span class="ms-3">占用率 ', rate, '%</span></p>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');
  }

  function getFilters() {
    return {
      keyword: $.trim($('#q-name').val()).toLowerCase(),
      type: $('#q-type').val(),
      level: $('#q-level').val()
    };
  }

  function applyFilters() {
    var f = getFilters();

    var matched = venues.filter(function (v) {
      var keywordOk = !f.keyword || v.name.toLowerCase().indexOf(f.keyword) !== -1;
      var typeOk = f.type === 'all' || v.type === f.type;
      var levelOk = f.level === 'all' || SportsData.levelOf(v).key === f.level;
      return keywordOk && typeOk && levelOk;
    });

    // 即时生效：输入与下拉变化都触发
    $('#venue-list').html(matched.map(venueCardHtml).join(''));
    $('#result-count').text('共 ' + matched.length + ' 个场馆');
    $('#result-empty').toggleClass('d-none', matched.length !== 0);
  }

  SportsData.load('data/data.json').then(function (result) {
    venues = result.venues;
    applyFilters();
  });

  // 输入即时筛选（input 事件兼顾粘贴与清除按钮）
  $('#q-name').on('input', applyFilters);
  $('#q-type, #q-level').on('change', applyFilters);
  $('#q-reset').on('click', function () {
    $('#q-name').val('');
    $('#q-type, #q-level').val('all');
    applyFilters();
  });
});
