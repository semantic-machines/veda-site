export const html = `
  <div class="container sheet page-sheet">
    <div class="row">
      <div class="col-md-2 col-md-push-10 vcenter" about="@" rel="v-s:hasImage" data-template="v-ui:ImageTemplate"></div><!--
   --><div class="col-md-10 col-md-pull-2 vcenter">
        <h1 about="@" property="site:heading"></h1>
        <p about="@" property="site:summary" class="markdown lead"></p>
      </div>
    </div>
    <hr />
    <p about="@" property="site:content" class="markdown"></p>
  </div>

`;
