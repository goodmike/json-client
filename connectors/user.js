/*******************************************************
 * TPS - Task Processing Service
 * user connector (server)
 * May 2015
 * Mike Amundsen (@mamund)
 * Soundtrack : Complete Collection : B.B. King (2008)
 *******************************************************/

// handles HTTP resource operations 
const qs = require('querystring');
const wstl = require('./../wstl.js');
const utils = require('./utils.js');

const components = {
  user: require('./../components/user-component.js')
};

const content =
  `<div class="ui segment">
    <h3>Manage your TPS Users here.</h3>
    <p>You can do the following:</p>
    <ul>
      <li>Add and Edit users</li>
      <li>Change the password, view the tasks assigned to a user</li>
      <li>Filter the list by Nickname or FullName</li>
    </ul>
  </div>`

module.exports = main;

// http-level actions for users
function main(req, res, parts, respond) {
  
  switch (req.method) {
    case 'GET':
      /* Web API no longer serves up passwordChange page
      if(flag===false && parts[1]==="pass" && parts[2]) {
        flag=true;
        sendPasswordPage(req, res, respond, parts[2]);
      }
      */
      if(parts[1] && parts[1].indexOf('?')===-1) {
        sendItemPage(req, res, respond, parts[1]);
      }
      else {
        sendListPage(req, res, respond);
      }
      break;
    case 'POST':
      if(parts[1] && parts[1].indexOf('?')===-1) {
        switch(parts[1].toLowerCase()) {
          /* Web API no longer supports update via POST
          case "update":
            updateUser(req, res, respond, parts[2]); 
            break;
          */  
          case "pass":
            changePassword(req, res, respond, parts[2]); 
            break;
          default:
            respond(req, res, 
              utils.errorResponse(req, res, 'Method Not Allowed', 405)
            );          
            break;
        }
      }
      else {
        addUserItem(req, res, respond);
      }
      break;
      case 'PUT':
        if(parts[1] && parts[1].indexOf('?')===-1) {
          updateUser(req, res, respond, parts[1]);
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
    data = components.user('filter', qs.parse(q[1]));
  }
  else {
    data = components.user('list');
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
    {name:"userLinkItem",href:"/user/{key}",
      rel:["item","/rels/item"],root:root},
    {name:"userLinkChangePW",href:"/user/pass/{key}",
      rel:["edit","/rels/edit"],root:root},
    {name:"userTasksLink",href:"/task/?assignedUser={key}",
      rel:["collection","/rels/tasksByUser"],root:root},

    // add template
    {name: "userFormAdd",href:"/user/",
      rel:["create-form","/rels/userAdd"],root:root},

    // list queries
    {name:"userFormListByNick",href:"/user/",
      rel:["search","/rels/usersByNick"],root:root},
    {name:"userFormListByName",href:"/user/",
      rel:["search","/rels/usersByName"],root:root}
  ];
  // compose and send graph 
  let doc = {
    title: "TPS - Users",
    actions: coll,
    data: data,
    content: content
  };
  respond(req, res, {code:200, doc:{user:doc}});
}

function sendItemPage(req, res, respond, id) {
  
  const root = '//'+req.headers.host;
  
  // load data item
  const item = components.user('read',id);
  if (item.length === 0) {
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
    
    // item actions
    {name:"userLinkItem",href:"/user/{key}",
      rel:["item","/rels/item"],root:root},
    {name:"userLinkChangePW",href:"/user/pass/{key}",
      rel:["edit","/rels/edit"],root:root},
    {name:"userTasksLink",href:"/task/?assignedUser={key}",
      rel:["collection","/rels/tasksByUser"],root:root},
    
    // item forms
    {name:"userFormEdit",href:"/user/{key}",
      rel:["edit-form","/rels/edit"],root:root},
    {name:"userFormEditPost",href:"/user/update/{key}",
      rel:["edit-form","/rels/edit"],root:root}
  ];
  // compose and send graph 
  const doc = {
    title: "TPS - Users",
    actions: coll,
    data: item,
    content: content
  };
  respond(req, res, {code:200, doc:{user:doc}});
}

function sendPasswordPage(req, res, respond, id) {
  const root = '//'+req.headers.host;
  
  // load data item
  const item = components.user('read',id);
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
    
    // item actions
    {name:"userLinkItem",href:"/user/{key}",
      rel:["item","/rels/item"],root:root},
    {name:"userLinkChangePW",href:"/user/pass/{key}",
      rel:["edit","/rels/edit"],root:root},
    {name:"userTasksLink",href:"/task/?assignedUser={key}",
      rel:["collection","/rels/tasksByUser"],root:root},
    
    // item forms
    {name:"userFormChangePW",href:"/user/pass/{key}",
      rel:["edit-form","/rels/edit"],root:root},
    {name:"userFormChangePWPost",href:"/user/pass/{key}",
      rel:["edit-form","/rels/edit"],root:root}
  ];
  
    // compose and send graph 
  const doc = {
    title: "TPS - Users",
    actions: coll,
    data: item,
    content: content
  };
    
  respond(req, res, {code:200, doc:{user:doc}});
}

// handle add user 
function addUserItem(req, res, respond) {

  // collect body
  let body = '';
  req.on('data', function(chunk) {
    body += chunk;
  });

  // process body
  req.on('end', function() {
    let doc;
    try {
      const msg = utils.parseBody(body, req.headers["content-type"]);
      if(!msg.nick || msg.nick===null || msg.nick==="") {
        doc = utils.errorResponse(req, res, "Missing Nick", 400);
      }
      if(!doc) {
        doc = components.user('add', msg, msg.nick);
        if(doc && doc.type==='error') {
          doc = utils.errorResponse(req, res, doc.message, doc.code);
        }
      }
    } 
    catch (ex) {
      doc = utils.errorResponse(req, res, 'Server Error', 500);
    }

    if (!doc) {
      respond(req, res, {code:303, doc:"", 
        headers:{'location':'//'+req.headers.host+"/user/"}
      });
    } 
    else {
      respond(req, res, doc);
    }
  });
}


// handle update user
function updateUser(req, res, respond, id) {

  // collect body
  let body = '';
  req.on('data', function(chunk) {
    body += chunk;
  });

  // process body
  req.on('end', function() {
    let doc;
    try {
      const msg = utils.parseBody(body, req.headers["content-type"]);
      doc = components.user('update', id, msg);
      if(doc && doc.type==='error') {
        doc = utils.errorResponse(req, res, doc.message, doc.code);
      }
    } 
    catch (ex) {
      doc = utils.errorResponse(req, res, 'Server Error', 500);
    }

    if (!doc) {
      respond(req, res, 
        {code:303, doc:"", headers:{'location':'//'+req.headers.host+"/user/"}}
      );
    } 
    else {
      respond(req, res, doc);
    }
  })
}


//handle change password
function changePassword(req, res, respond, id) {
  
  // collect body
  let body = '';
  req.on('data', function(chunk) {
    body += chunk;
  });

  // process body
  req.on('end', function() {
    let doc;
    try {
      const msg = utils.parseBody(body, req.headers["content-type"]);
      doc = components.user('change-password', id, msg);
      if(doc && doc.type==='error') {
        doc = utils.errorResponse(req, res, doc.message, doc.code);
      }
    } 
    catch (ex) {
      doc = utils.errorResponse(req, res, 'Server Error', 500);
    }

    if (!doc) {
      respond(req, res, 
        {code:303, doc:"", headers:{'location':'//'+req.headers.host+"/user/"}}
      );
    } 
    else {
      respond(req, res, doc);
    }
  })
}

// EOF

