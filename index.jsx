import { Plugin } from '@vizality/entities';
import { patch, unpatch } from '@vizality/patcher';
import { getModule, getModuleByDisplayName } from '@vizality/webpack';
import React from 'react';

const UserStore = getModule('getUser', 'getUsers');
const FriendsModule = getModule('isBlocked');
const ImageResolver = getModule('getUserAvatarURL');
const {Avatar} = getModule('Avatar');
const UserInfoStore = getModule('getCurrentUser');

export default class TypingAvatars extends Plugin {
   start() {
      this.injectStyles('style.scss');

      let TypingUsers = () => null;
      try {TypingUsers = getModuleByDisplayName('FluxContainer(TypingUsers)').prototype.render.call({memoizedGetStateFromStores: () => ({}), props: {}}).type}
      catch {};

      patch('typing-avatars', TypingUsers.prototype, 'render', function (_ ,res) {
         const me = UserInfoStore.getCurrentUser();

         const typingUsers = Object.keys(this.props.typingUsers || {})
            .map(id => UserStore.getUser(id))
            .filter(user => {
               if (!user) return false;
               if (user.id == me) return false;
               if (FriendsModule.isBlocked(user.id)) return false;
               return true;
            });
         
         if (!typingUsers) return res

         for (let i = 0; i < typingUsers.length; i++) {
            const childs = res?.props?.children?.[1]?.props?.children?.[i * 2];
            if (!Array.isArray(childs?.props?.children)) continue;
            const name = childs.props.children.join('');
            childs.props.children = <div className="typingUser">
               <Avatar src={ImageResolver.getUserAvatarURL(typingUsers[i])} size={Avatar.Sizes.SIZE_16} />
               <span>{name}</span>
            </div>;
         }

         return res;
      });
   }

   stop() {
      unpatch('typing-avatars');
   }
}
