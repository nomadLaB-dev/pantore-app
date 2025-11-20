"use client";

import React, { useState } from 'react';
import { 
  MOCK_USERS_LIST, MOCK_ASSETS,
  type UserSummary, type Asset
} from '@/lib/demo';

// 作成したコンポーネントをインポート
import { UserList } from '@/components/features/users/UserList';
import { UserCreateModal } from '@/components/features/users/UserCreateModal';
import { UserDetailModal } from '@/components/features/users/UserDetailModal';

export default function UsersPage() {
  // データ管理（大元）
  const [users, setUsers] = useState<UserSummary[]>(MOCK_USERS_LIST);
  const [assets, setAssets] = useState<Asset[]>(MOCK_ASSETS);

  // UI状態管理
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // ハンドラー
  const handleCreateUser = (newUser: UserSummary) => {
    setUsers([...users, newUser]);
    alert(`ユーザー「${newUser.name}」を追加しました！🎉`);
  };

  // 🆕 ユーザー情報更新用ハンドラー (ステータス変更など)
  const handleUpdateUser = (updatedUser: UserSummary) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    alert(`ユーザーステータスを更新しました！✨`);
  };

  // 選択中のユーザーオブジェクトを取得
  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <>
      <UserList 
        users={users}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onUserClick={setSelectedUserId}
        onOpenCreateModal={() => setIsCreateOpen(true)}
      />

      <UserCreateModal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onSave={handleCreateUser} 
      />

      {selectedUserId && selectedUser && (
        <UserDetailModal 
          key={selectedUserId} // 🚨 これで再レンダリングを強制
          initialUser={selectedUser}
          onClose={() => setSelectedUserId(null)}
          onUpdateUser={handleUpdateUser} // 🆕 追加
          assets={assets}
          setAssets={setAssets}
        />
      )}
    </>
  );
}