export const html = `
  <div about="@" rel="site:hasArticle">
    <div class="container sheet page-sheet">
      <style>
        table {
          width: 100%;
          margin-bottom: 1.5em;
          border-spacing: 0;
        }
        table thead {
          padding: 0;
          border: 0;
          height: 1px;
          width: 1px;
          overflow: hidden;
        }
        table thead th {
          background-color: #f5f5f5;
          border-bottom: 2px solid #ddd;
          font-weight: bold;
          /*text-align: center;*/
          padding: 0.3em;
        }
        table th,
        table td {
          padding: 0.3em;
          text-align: left;
          white-space: normal;
          vertical-align: middle;
        }
        /*
        table th,
        table td {
          padding: .5em;
          vertical-align: middle;
          display: table-cell;
          padding: .5em;
        }
        table caption {
          margin-bottom: 1em;
          font-size: 1em;
          font-weight: bold;
          text-align: center;
        }
        table tfoot {
          font-size: .8em;
          font-style: italic;
        }
        table tbody tr {
          margin-bottom: 1em;
        }
        table tbody tr:last-of-type {
          margin-bottom: 0;
        }
        table tbody tr:nth-of-type(even) {
          background-color: rgba(0,0,0,.12);
        }
        table tbody th[scope="row"] {
          background-color: rgba(38,137,13,1);
          color: white;
          border-left: 1px solid rgba(134,188,37,1);
          border-bottom: 1px solid rgba(134,188,37,1);
        }
        table tbody td {
          text-align: right;
          border-left: 1px solid rgba(134,188,37,1);
          border-bottom: 1px solid rgba(134,188,37,1);
          text-align: center;
        }
        table tbody td:last-of-type {
          border-right: 1px solid rgba(134,188,37,1);
        }*/
      </style>
      <div class="row">
        <div class="col-md-2 col-md-push-10 vcenter" about="@" rel="v-s:hasImage" data-template="v-ui:ImageTemplate"></div><!--
     --><div class="col-md-10 col-md-pull-2 vcenter">
          <h1 about="@" property="site:heading"></h1>
          <p about="@" property="site:summary" class="markdown lead"></p>
        </div>
      </div>
      <!--hr /-->
      <p about="@" property="site:content" class="markdown"></p>
    </div>
  </div>
`;
