/*******************************************************
 * TPS - Task Processing Service
 * task connector (server)
 * May 2015
 * Mike Amundsen (@mamund)
 * Soundtrack : Complete Collection : B.B. King (2008)
 *******************************************************/

// handles HTTP resource operations 
const qs = require('querystring');

const wstl = require('./../wstl.js');
const utils = require('./utils.js');

const components = {
  task: require('./../components/task-component.js'),
  user: require('./../components/user-component.js')
};

const content =
  `<div class="ui segment">
    <h3>Manage your TPS Tasks here.</h3>
    <p>You can do the following:</p>
    <ul>
        <li>Add, Edit and Delete tasks</li>
        <li>Mark tasks "complete", assign tasks to a user</li>
        <li>Filter the list by Title, Assigned User, and Completed Status</li>
    </ul>
  </div>`;

module.exports = main;

// http-level actions for tasks
function main(req, res, parts, respond) {

  switch (req.method) {
    case 'GET':
      /* Web API no longer serves up assign and completed forms
      if(flag===false && parts[1]==="assign" && parts[2]) {
        flag=true;
        sendAssignPage(req, res, respond, parts[2]);
      }
      if(flag===false && parts[1]==="completed" && parts[2]) {
        flag=true;
        sendCompletedPage(req, res, respond, parts[2]);
      }
      */
      // If an ID is present in request URL, e.g. /task/abc123
      if(parts[1] && parts[1].indexOf('?')===-1) {
        sendItemPage(req, res, respond, parts[1]);
      }
      // URL is /task
      else {
        sendListPage(req, res, respond);
      }
    break;
    case 'POST':
      if(parts[1] && parts[1].indexOf('?')===-1) {
        switch(parts[1].toLowerCase()) {
          /* Web API no longer supports update & remove via POST
          case "update":
            updateTask(req, res, respond, parts[2]); 
            break;
          case "remove":
            removeTask(req, res, respond, parts[2]);
            break;
          */
          // e.g. task/completed/abc123
          case "completed":
            markCompleted(req, res, respond, parts[2]);
            break;
          // e.g. task/assign/abc123
          case "assign":
            assignUser(req, res, respond, parts[2]);
            break;
          default:
            respond(req, res, 
              utils.errorResponse(req, res, 'Method Not Allowed', 405)
            );          
        }
      }
      else {
        addTask(req, res, respond);
      }
    break;
    case 'PUT':
      // e.g. task/abc123
      if(parts[1] && parts[1].indexOf('?')===-1) {
        updateTask(req, res, respond, parts[1]);
      }
      else {
        respond(req, res, 
          utils.errorResponse(req, res, 'Method Not Allowed', 405)
        );          
      }
    break;
    // e.g. task/abc123
    case 'DELETE':
      if(parts[1] && parts[1].indexOf('?')===-1) {
        removeTask(req, res, respond, parts[1]);
      }
      else {
        respond(req, res, 
          utils.errorResponse(req, res, 'Method Not Allowed', 405)
        );          
      }
    break;    
  default:
    respond(req, res, utils.errorResponse(req, res, 'Method Not Allowed', 405));
    break;
  }
}

function sendListPage(req, res, respond) {
  const root = '//'+req.headers.host;

  // parse any filter on the URL line
  // or just pull the full set
  let data = [];

  const q = req.url.split('?');
  if(q[1]!==undefined) {
    data = components.task('filter', qs.parse(q[1]));
  }
  else {
    data = components.task('list');
  }
  
  const coll = [
  // top-level links
  {name:"homeLink",href:"/home/",
    rel:["collection","/rels/home"],root:root},
  {name:"taskLink",href:"/task/",
    rel:["collection","/rels/task"],root:root}, 
  {name:"userLink",href:"/user/",
    rel:["collection","rels/user"],root:root},
  
  // item actions
  {name:"taskLinkItem",href:"/task/{key}",
    rel:["item","/rels/item"],root:root},
  {name:"taskAssignLink",href:"/task/assign/{key}",
    rel:["edit-form","/rels/taskAssignUser"],root:root},
  {name:"taskCompletedLink",href:"/task/completed/{key}",
    rel:["edit-form","/rels/taskMarkCompleted"],root:root},
  
  // add template
  {name:"taskFormAdd",href:"/task/",
    rel:["create-form","/rels/taskAdd"],root:root},

  // list queries
  {name:"taskFormListCompleted",href:"/task/",
    rel:["search","/rels/taskCompleted"],root:root},
  {name:"taskFormListActive",href:"/task/",
    rel:["search","/rels/taskActive"],root:root},
  {name:"taskFormListByTitle",href:"/task/",
    rel:["search","/rels/taskByTitle"],root:root},
  {name:"taskFormListByUser",href:"/task/",
    rel:["search","/rels/taskByUser"],root:root},
];

  // compose and send graph 
  const doc = {
    title: "TPS - Tasks",
    actions: coll,
    data: data,
    content: content,
    related: {}
  };
  respond(req, res, {code:200, doc:{task:doc}});
  
}

function sendItemPage(req, res, respond, id) {
  const root = '//'+req.headers.host;
  
  // load data item
  const item = components.task('read',id);
  if(item.length===0) {
    return respond(req, res, utils.errorResponse(req, res, "File Not Found", 404));
  }

  const coll = [
    // top-level links
    {name:"homeLink",href:"/home/",
      rel:["collection","/rels/home"],root:root},
    {name:"taskLink",href:"/task/",
      rel:["collection","/rels/task"],root:root},
    {name:"userLink",href:"/user/",
      rel:["collection","rels/user"],root:root},

    // item links
    {name:"taskLinkItem",href:"/task/{key}",
      rel:["item","/rels/item"],root:root},
    {name:"taskAssignLink",href:"/task/assign/{key}",
      rel:["edit-form","/rels/taskAssignUser"],root:root},
    {name:"taskCompletedLink",href:"/task/completed/{key}",
      rel:["edit-form","/rels/taskMarkCompleted"],root:root},

    // item forms
    {name:"taskFormEdit",href:"/task/{key}",
      rel:["edit-form","/rels/edit"],root:root},
    {name:"taskFormEditPost",href:"/task/update/{key}",
      rel:["edit-form","/rels/edit"],root:root},
    {name:"taskFormRemovePost",href:"/task/remove/{key}",
      rel:["edit-form","/rels/remove"],root:root}
  ];

  // compose and send graph
  const doc = {
    title: "TPS - Tasks",
    actions: coll,
    data: item,
    content: content,
    related: {}
  };
  respond(req, res, {code:200, doc:{task:doc}});
}

function sendAssignPage(req, res, respond, id) {
  const root = '//'+req.headers.host;
  
  // load data item
  let item = components.task('read',id);
  if(item.length===0) {
    return respond(req, res, utils.errorResponse(req, res, "File Not Found", 404));
  }

  const coll = [
    // top-level links
    {name:"homeLink",href:"/home/",
      rel:["collection","/rels/home"],root:root},
    {name:"taskLink",href:"/task/",
      rel:["collection","/rels/task"],root:root},
    {name:"userLink",href:"/user/",
      rel:["collection","rels/user"],root:root},

    // item links
    {name:"taskLinkItem",href:"/task/{key}",
      rel:["item","/rels/item"],root:root},
    {name:"taskAssignLink",href:"/task/assign/{key}",
      rel:["edit-form","/rels/taskAssignUser"],root:root},
    {name:"taskCompletedLink",href:"/task/completed/{key}",
      rel:["edit-form","/rels/taskMarkCompleted"],root:root},

    // item forms
    {name:"taskAssignForm",href:"/task/assign/{key}",
      rel:["edit-form","/rels/taskAssignUser"],root:root}
  ];
  // compose & send graph
  const doc = {
    title: "TPS - Tasks",
    actions: coll,
    data: item,
    content: content,
    related: components.user('list')
  };
  respond(req, res, {code:200, doc:{task:doc}});
}

function sendCompletedPage(req, res, respond, id) {
  
  const root = '//'+req.headers.host;
  
  // load data item
  let item = components.task('read',id);
  if(item.length===0) {
    return respond(req, res, utils.errorResponse(req, res, "File Not Found", 404));
  }

  const coll = [
    // top-level links
    {name:"homeLink",href:"/home/",
      rel:["collection","/rels/home"],root:root},
    {name:"taskLink",href:"/task/",
      rel:["collection","/rels/task"],root:root},
    {name:"userLink",href:"/user/",
      rel:["collection","rels/user"],root:root},

    // item links
    {name:"taskLinkItem",href:"/task/{key}",
      rel:["item","/rels/item"],root:root},
    {name:"taskAssignLink",href:"/task/assign/{key}",
      rel:["edit-form","/rels/taskAssignUser"],root:root},
    {name:"taskCompletedLink",href:"/task/completed/{key}",
      rel:["edit-form","/rels/taskMarkCompleted"],root:root},
    
    // item forms
    {name:"taskCompletedForm",href:"/task/completed/{key}",
      rel:["edit-form","/rels/taskMarkCompleted"],root:root}
  ];

  // compose & send graph 
  const doc = {
    title: "TPS - Tasks",
    actions: coll,
    data: item,
    content: content,
    related: {}
  };
  respond(req, res, {code:200, doc:{task:doc}});
}

// handle add operation
function addTask(req, res, respond) {

  // collect body
  let body = '';
  req.on('data', function(chunk) {
    body += chunk;
  });

  // process body
  req.on('end', function() {
    let doc;

    try {
      let msg = utils.parseBody(body, req.headers["content-type"]);
      doc = components.task('add', msg);
      if(doc && doc.type==='error') {
        doc = utils.errorResponse(req, res, doc.message, doc.code);
      }
    }
    catch (ex) {
      doc = utils.errorResponse(req, res, 'Server Error', 500);
    }

    if (!doc) {
      respond(req, res, {code:303, doc:"",
        headers:{'location':'//'+req.headers.host+"/task/"}
      });
    }
    else {
      respond(req, res, doc);
    }
  });
}

// handle update operation
function updateTask(req, res, respond, id) {
  
  // collect body
  let body = '';
  req.on('data', function(chunk) {
    body += chunk;
  });

  // process body
  req.on('end', function() {
    let doc;
    try {
      let msg = utils.parseBody(body, req.headers["content-type"]);
      doc = components.task('update', id, msg);
      if(doc && doc.type==='error') {
        doc = utils.errorResponse(req, res, doc.message, doc.code);
      }
    } 
    catch (ex) {
      doc = utils.errorResponse(req, res, 'Server Error', 500);
    }

    if (!doc) {
      respond(req, res, 
        {code:303, doc:"", headers:{'location':'//'+req.headers.host+"/task/"}}
      );
    } 
    else {
      respond(req, res, doc);
    }
  })
}

// handle remove operation (no body)
function removeTask(req, res, respond, id) {
  let doc;
  
  // execute
  try {
    doc = components.task('remove', id);
    if(doc && doc.type==='error') {
      doc = utils.errorResponse(req, res, doc.message, doc.code);    
    }
  } 
  catch (ex) {
    doc = utils.errorResponse(req, res, 'Server Error', 500);
  }
  
  if (!doc) {
    respond(req, res, 
      {code:303, doc:"", headers:{'location':'//'+req.headers.host+"/task/"}}
    );
  } 
  else {
    respond(req, res, doc);
  }
}

// handle mark complete operation (no body)
function markCompleted(req, res, respond, id) {
  let doc;

  // execute
  try {
    doc = components.task('mark-completed', id);
    if(doc && doc.type==='error') {
      doc = utils.errorResponse(req, res, doc.message, doc.code);    
    }
  }
  catch (ex) {
    doc = utils.errorResponse(req, res, 'Server Error', 500);
  }

  if (!doc) {
    respond(req, res, 
      {code:303, doc:"", headers:{'location':'//'+req.headers.host+"/task/"}}
    );
  } 
  else {
    respond(req, res, doc);
  }
}

// handle assign user operation 
function assignUser(req, res, respond, id) {

  // collect body
  let body = '';
  req.on('data', function(chunk) {
    body += chunk;
  });

  // process body
  req.on('end', function() {
    let doc;
    try {
      let msg = utils.parseBody(body, req.headers["content-type"]);
      doc = components.task('assign-user', id, msg);
      if(doc && doc.type==='error') {
        doc = utils.errorResponse(req, res, doc.message, doc.code);
      }
    } 
    catch (ex) {
      doc = utils.errorResponse(req, res, 'Server Error', 500);
    }

    if (!doc) {
      respond(req, res, 
        {code:303, doc:"", headers:{'location':'//'+req.headers.host+"/task/"}}
      );
    } 
    else {
      respond(req, res, doc);
    }
  })
}

// EOF

