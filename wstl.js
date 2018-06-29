/*******************************************************
 * TPS - Task Processing Service
 * wstl document (server)
 * May 2015
 * Mike Amundsen (@mamund)
 * Soundtrack : Complete Collection : B.B. King (2008)
 *******************************************************/

// library for managing the state transitions
// function set for finding transitions at runtime
// holds the list of *all* possible state transitions for this service

// ************************
// run on first load;
// ************************
const trans = loadTrans();
const transDict = trans.reduce(
  function(acc, tran) {
    acc[tran['name']] = tran;
    return acc;
  }
);
// low-level finder: return a copy of the transaction object
exports.find = function(name) {
  const found = transDict[name];
  if (!found) { return null; }
  return Object.assign({}, found);
};

// make a base transition
// object = {name,href,rel[],root}
exports.make = function(object) {
  const name = object.name;

  if(!name || name===null || name==="") {
    return null;
  }

  const root = object.root || "";
  const href = object.href || "#";
  const rel = object.rel || "";

  var tran = this.find(object.name);

  if(tran === null) {
    return null;
  }

  tran.href = root + href;

  if(Array.isArray(rel) === true) {
    tran.rel = rel.map(
      function(r) {
        return (r.indexOf('/') === 0 ? root + r : r);
      }
    );
  }
  else {
    tran.rel = (rel.indexOf('/') === 0 ? root + rel : rel);
  }

  return tran;
};

// append a base transition to a collection
exports.append = function(object, coll) {
  var trans;
  
  trans = this.make(object);
  if(trans!==null) {
    coll.splice(coll.length, 0, trans);
  }
  return coll;
};

exports.all = function all() {
  // Expose a copy
  return loadTrans();
};

// internal filling routine
function loadTrans() {
  return [

  /************************************
  HOME
  *************************************/
  {
    name : "homeLink",
    type : "safe",
    action : "read",
    kind : "home",
    target : "list menu",
    prompt : "Home"
  }, {
    name : "taskLink",
    type : "safe",
    action : "read",
    kind : "task",
    target : "list menu",
    prompt : "Tasks"
  }, {
    name : "userLink",
    type : "safe",
    action : "read",
    kind : "user",
    target : "list menu",
    prompt : "Users"
  },
  /************************************
  TASKS
  *************************************/
  {
    name : "taskFormListActive",
    type : "safe",
    action : "read",
    kind : "task",
    target : "list query",
    prompt : "Active Tasks",
    inputs : [
      {name : "completeFlag", prompt : "Complete", value : "false", readOnly:true}
    ]
  }, {
    name : "taskFormListCompleted",
    type : "safe",
    action : "read",
    kind : "task",
    target : "list query",
    prompt : "Completed Tasks",
    inputs : [
      {name : "completeFlag", prompt : "Complete", value : "true", readOnly:true}
    ]
  }, {
    name : "taskFormListByTitle",
    type : "safe",
    action : "read",
    kind : "task",
    target : "list query",
    prompt : "Search By Title",
    inputs : [
      {name : "title", prompt : "Title", value : ""}
    ]
  }, {
    name : "taskFormListByUser",
    type : "safe",
    action : "read",
    kind : "task",
    target : "list query",
    prompt : "Search By Assigned User",
    inputs : [
      {name : "assignedUser", prompt : "User", value : ""}
    ]
  }, {
    name : "taskLinkItem",
    type : "safe",
    action : "read",
    kind : "task",
    target : "item",
    prompt : "Detail",
    html : {
      className : "item link ui basic blue button"
    }
  },
  // add task
  {
    name : "taskFormAdd",
    type : "unsafe",
    action : "append",
    kind : "task",
    target : "list add",
    prompt : "Add Task",
    inputs : [
      {name : "title", prompt : "Title", required : true},
      {name : "completeFlag", prompt : "Complete", value : "false", 
        pattern :"true|false",
        type:"select",
        suggest:[{value:"false"},{value:"true"}] 
      }
    ]
  },
  // edit task
  {
    name : "taskFormEditPost",
    type : "unsafe",
    action : "append",
    kind : "task",
    prompt : "Edit Task",
    target : "item edit form post",
    inputs : [
      {name : "id", prompt : "ID", value : "", readOnly : true},
      {name : "title", prompt : "Title", value : ""},
      {name : "completeFlag", prompt : "Complete", value : "false", 
        pattern :"true|false",
        type:"select",
        suggest:[{value:"false"},{value:"true"}] 
      }
    ]
  },
  // remove task
  {
    name : "taskFormRemovePost",
    type : "unsafe",
    action : "append",
    kind : "task",
    prompt : "Remove Task",
    target : "item edit form post",
    inputs : [
      {name : "id", prompt : "ID", readOnly : true}
    ]
  },
  // mark task completed
  {
    name : "taskCompletedLink",
    type : "safe",
    action : "read",
    kind : "task",
    target : "item",
    prompt : "Mark Completed",
    html : {
      className : "item action ui basic blue button"
    }
  }, {
    name : "taskCompletedForm",
    type : "unsafe",
    action : "append",
    kind : "task",
    target : "item completed edit post form",
    prompt : "Mark Completed",
    inputs : [
      {name: "id", prompt:"ID", readOnly:true}
    ]
  }, {
    name : "taskAssignLink",
    type : "safe",
    action : "read",
    kind : "task",
    target : "item",
    prompt : "Assign User",
    html : {
      className : "item action ui basic blue button"
    }
  }, {
    name : "taskAssignForm",
    type : "unsafe",
    action : "append",
    kind : "task",
    target : "item assign edit post form",
    prompt : "Assign User",
    inputs : [
      {name: "id", prompt:"ID", readOnly:true},
      {name: "assignedUser", prompt:"User Nickname", value:"", requried:true, suggest:{related:"userlist", value:"nick",text:"nick"}, type:"select"}
    ]
  },
  /************************************
  USERS
  *************************************/
 {
    name : "userLinkItem",
    type : "safe",
    action : "read",
    kind : "user",
    target : "item",
    prompt : "Detail",
    html : {
      className : "item link ui basic blue button"
    }
  }, {
    name : "userTasksLink",
    type : "safe",
    action : "read",
    kind : "user",
    target : "item",
    prompt : "Assigned Tasks",
    html : {
      className : "item link ui basic blue button"
    }
  }, {
    name : "userFormListByNick",
    type : "safe",
    action : "read",
    kind : "task",
    target : "list query",
    prompt : "Search By Nick",
    inputs : [
      {name : "nick", prompt : "Nickname", value : ""}
    ]
  }, {
    name : "userFormListByName",
    type : "safe",
    action : "read",
    kind : "task",
    target : "list query",
    prompt : "Search By Name",
    inputs : [
      {name : "name", prompt : "Name", value : ""}
    ]
  }, {
    name : "userFormAdd",
    type : "unsafe",
    action : "append",
    kind : "task",
    target : "list add",
    prompt : "Add User",
    inputs : [
      {name : "nick", prompt : "Nickname", required: true, pattern: "[a-zA-Z0-9]+"},
      {name : "name", prompt : "Full Name", value: "", required: true}, 
      {name : "password", prompt : "Password", value: "", required: true, pattern: "[a-zA-Z0-9!@#$%^&*-]+"}
    ]
  }, {
    name : "userFormEditPost",
    type : "unsafe",
    action : "append",
    kind : "task",
    prompt : "Edit User",
    target : "item edit form post",
    inputs : [
      {name : "nick", prompt : "Nickname", value : "", readOnly: true},
      {name : "name", prompt : "Full Name", value : ""}
    ]
  }, {
    name : "userLinkChangePW",
    type : "safe",
    action : "read",
    kind : "user",
    target : "item",
    prompt : "Change Password",
    html : {
      className : "item link ui basic blue button"
    }
  }, {
    name : "userFormChangePWPost",
    type : "unsafe",
    action : "append",
    kind : "task",
    prompt : "Change Password",
    target : "item edit form post",
    inputs : [
      {name : "nick", prompt : "Nickname", value : "", readOnly: true},
      {name : "oldpass", prompt : "Current Password", value : "", required: true, pattern: "[a-zA-Z0-9!@#$%^&*-]+"},
      {name : "newpass", prompt : "New Password", value : "", required: true, pattern: "[a-zA-Z0-9!@#$%^&*-]+"},
      {name : "checkpass", prompt : "Confirm New Password", value : "", required: true, pattern: "[a-zA-Z0-9!@#$%^&*-]+"}
    ]
  }];
}

// EOF

