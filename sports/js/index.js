/* ==========================================================================
   首页：渲染六处场馆当前人数卡片与全校区汇总（jQuery + SportsData）
   ========================================================================== */
$(function () {
  'use strict';

  $('#year').text(new Date().getFullYear());

  function venueCardHtml(v) {
    var level = SportsData.levelOf(v);
    var rate = Math.round((v.current / v.capacity) * 100);

    return [
      '<div class="col-sm-6 col-xl-4">',
      '  <div class="card venue-card rate-' + level.key + '">',
      '    <div class="card-body">',
      '      <div class="venue-head">',
      '        <h5 class="venue-name"><span class="venue-icon"><i class="bi ' + v.icon + '"></i></span>', v.name, '</h5>',
      '        <span class="badge level-badge ' + level.badge + '">', level.text, '</span>',
      '      </div>',
      '      <div class="venue-count">', v.current, ' <small>/ ', v.capacity, ' 人</small></div>',
      '      <div class="progress mt-2" role="progressbar" aria-valuenow="', rate,
      '" aria-valuemin="0" aria-valuemax="100" aria-label="', v.name, '占用率">',
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

  SportsData.load('data/data.json').then(function (result) {
    if (!result.venues.length) {
      $('#venue-list').empty();
      $('#venue-empty').removeClass('d-none');
      $('#sum-current, #sum-capacity').text('0');
      $('#sum-rate').text('—');
      return;
    }

    var current = 0;
    var capacity = 0;
    result.venues.forEach(function (v) {
      current += v.current;
      capacity += v.capacity;
    });

    $('#sum-current').text(current.toLocaleString('zh-CN'));
    $('#sum-capacity').text(capacity.toLocaleString('zh-CN'));
    $('#sum-rate').text(Math.round((current / capacity) * 100) + '%');
    $('#venue-list').html(result.venues.map(venueCardHtml).join(''));
  });
});
