"use client";

import React, { useState, useEffect } from 'react';
import {
  type UserSummary, type Asset, type MasterData
} from '@/lib/types';
import {
  fetchUsersAction,
  createUserAction,
  updateUserAction
} from '@/app/actions/users';
import { fetchAssetsAction } from '@/app/actions/assets';
import { fetchMasterDataAction } from '@/app/actions/settings';
import { fetchCurrentUserAction } from '@/app/actions/auth';

// 作成したコンポーネントをインポート
import { UserList } from '@/components/features/users/UserList';
import { UserCreateModal } from '@/components/features/users/UserCreateModal';
import { UserDetailModal } from '@/components/features/users/UserDetailModal';

export default function UsersPage() {
  // データ管理（大元）
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [masterData, setMasterData] = useState<MasterData>({ companies: [], departments: [], branches: [] });
  const [isLoading, setIsLoading] = useState(true);

  // UI状態管理
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('member');

  // データ取得
  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersData, assetsData, masterDataData, currentUserData] = await Promise.all([
          fetchUsersAction(),
          fetchAssetsAction(),
          fetchMasterDataAction(),
          fetchCurrentUserAction()
        ]);
        setUsers(usersData);
        setAssets(assetsData);
        setMasterData(masterDataData);
        setCurrentUserRole(currentUserData?.role || 'member');
      } catch (error) {
        console.error('Failed to load users/assets:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // ハンドラー
  const handleCreateUser = async (newUser: UserSummary) => {
    try {
      await createUserAction(newUser);
      // リロードして最新化
      const updatedUsers = await fetchUsersAction();
      setUsers(updatedUsers);
      alert(`ユーザー「${newUser.name}」を追加しました！🎉`);
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('ユーザー作成に失敗しました。');
    }
  };

  // 🆕 ユーザー情報更新用ハンドラー (ステータス変更など)
  const handleUpdateUser = async (updatedUser: UserSummary) => {
    try {
      await updateUserAction(updatedUser);
      // リロードして最新化
      const updatedUsers = await fetchUsersAction();
      setUsers(updatedUsers);
      alert(`ユーザーステータスを更新しました！✨`);
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('ユーザー更新に失敗しました。');
    }
  };

  // 選択中のユーザーオブジェクトを取得
  const selectedUser = users.find(u => u.id === selectedUserId);

  if (isLoading) {
    return <div className="p-10 text-center text-gray-500">読み込み中...</div>;
  }

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
        masterData={masterData}
      />

      {selectedUserId && selectedUser && (
        <UserDetailModal
          key={selectedUserId} // 🚨 これで再レンダリングを強制
          initialUser={selectedUser}
          onClose={() => setSelectedUserId(null)}
          onUpdateUser={handleUpdateUser}
          assets={assets}
          setAssets={setAssets}
          currentUserRole={currentUserRole}
        />
      )}
    </>
  );
}