export const html = `
  <div class="container-fluid bg-white">
    <div class="container margin-xxl">
      <div class="row">
        <div class="col-md-5 col-md-push-7">
          <div about="@" rel="v-s:hasImage" data-template="v-ui:ModalImageTemplate"></div>
        </div>
        <div class="col-md-7 col-md-pull-5">
          <h1 about="@" property="site:heading" class="margin-xl"></h1>
          <p about="@" property="site:summary" class="markdown lead"></p>
          <a href="#/site:Platform" class="btn btn-lg btn-primary margin-xl">
            <span about="site:More" property="rdfs:label"></span>
          </a>
          <a href="#/site:Download" class="btn btn-lg btn-success margin-xl">
            <span about="site:Download" property="rdfs:label"></span>
          </a>
        </div>
      </div>
    </div>
  </div>
`;
