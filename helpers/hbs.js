module.exports={
        ifcond: function (v1, operator, v2) {
            if(operator == "=="){
                if(v1==v2){
                    return true;
                }
                else{
                    return false;
                }
            }
            if(operator == "!="){
                if(v1!=v2){
                    return true;
                }
                else{
                    return false;
                }
            }
        },
        idorrolecheck: function (useraccess, user, userrole, accessrole) {
           if((useraccess == user)||(userrole == accessrole)){
               return true;
           }
           else{
               return false;
           }
        },
        find: function(comm, communitiesjoined){
            for(let i = 0; i < communitiesjoined.length; i++){
                if(comm == communitiesjoined[i]){
                    return true;
                }
            }
            return false;
        },
        notmatch : function(id, communitiesjoined){
            for(let i = 0; i < communitiesjoined.length; i++){
                if(id == communitiesjoined[i]){
                    return false;
                }
            }
            return true;
        },
        findname : function(useraccess, users){
            for(let i = 0; i < users.length; i++){
                if(useraccess == users[i].id){
                    return users[i].name;
                }
            }
        },
        checkrole : function(role,v1,v2){
            if((role == v1)||(role == v2)){
                return true;
            }
            else{
                return false;
            }
        },
        findpendingcommunities : function(comm,pendingcommunities){
            for(let i = 0; i < pendingcommunities.length; i++){
                if(comm == pendingcommunities[i]){
                    return true;
                }
            }
            return false; 
        },
        not: function(val){
            if(!val){
                return true;
            }
            return false;
        }

};