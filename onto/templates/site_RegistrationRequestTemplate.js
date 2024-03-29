export const html = `
  <div>
    <h3 about="@" rel="rdf:type" data-template="v-ui:LabelTemplate"></h3>

    <em about="v-s:lastName" property="rdfs:label"></em>
    <div property="v-s:lastName" class="view -edit -search"></div>
    <veda-control property="v-s:lastName" data-type="string" class="-view edit search"></veda-control>

    <em about="v-s:firstName" property="rdfs:label"></em>
    <div property="v-s:firstName" class="view -edit -search"></div>
    <veda-control property="v-s:firstName" data-type="string" class="-view edit search"></veda-control>

    <em about="v-s:middleName" property="rdfs:label"></em>
    <div property="v-s:middleName" class="view -edit -search"></div>
    <veda-control property="v-s:middleName" data-type="string" class="-view edit search"></veda-control>

    <br />
    <button class="btn btn-success btn-lg btn-block action" id="save" about="v-s:Send" property="rdfs:label"></button>
    <br />
    <span class="text-muted" about="@" property="@"></span>
  </div>
`;
