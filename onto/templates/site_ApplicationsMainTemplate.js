export const html = `
<div class="container-fluid bg-none">
  <div class="container margin-xxl">
    <div class="row">
      <div class="col-md-2 col-md-push-10 vcenter" about="@" rel="v-s:hasImage" data-template="v-ui:ImageTemplate"></div><!--
   --><div class="col-md-10 col-md-pull-2 vcenter">
        <h1 about="@" property="site:heading" class="margin-xl"></h1>
        <p about="@" property="site:summary" class="markdown lead"></p>
        <a href="#/site:Applications" class="btn btn-lg btn-primary margin-xl">
          <span about="site:More" property="rdfs:label"></span>
        </a>
      </div>
    </div>
  </div>
</div>
`;