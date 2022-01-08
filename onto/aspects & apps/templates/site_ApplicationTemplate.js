import $ from 'jquery';

export const pre = function (individual, template, container, mode, extra) {
  template = $(template);
  container = $(container);

  if (!individual.hasValue('v-s:hasBlank') && !individual.hasValue('v-s:hasCreate')) {
    $('.blanks', template).remove();
  }
  if (!individual.hasValue('v-s:hasRegistry')) {
    $('.registries', template).remove();
  }
  if (!individual.hasValue('v-s:hasReport')) {
    $('.reports', template).remove();
  }
};

export const html = `
  <div about="@" class="container">
    <div>
      <div class="sheet">
        <div class="clearfix">
          <div class="pull-left" style="width:78px;" about="@" rel="v-s:hasIcon" data-template="v-ui:ImageTemplate"></div>
          <h2 class="pull-left margin-lg-h" style="color: #555;">
            <span href="#/@" property="rdfs:label"></span>
            <small property="rdfs:comment"></small>
          </h2>
        </div>
        <hr class="margin-md" />
        <div class="row">
          <div class="col-lg-9 col-sm-6" style="border-right: 1px dotted #ddd;">
            <div about="@" property="v-s:summary" class="markdown"></div>
          </div>
          <div class="col-lg-3 col-sm-6">
            <!--strong about="v-s:attachment" property="rdfs:label"></strong-->
            <div about="@" rel="v-s:attachment" data-template="v-ui:FileTemplate"></div>
          </div>
        </div>
      </div>
      <div about="@" property="v-s:description" class="sheet markdown"></div>
    </div>
  </div>
`;
