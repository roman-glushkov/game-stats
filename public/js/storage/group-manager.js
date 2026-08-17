export class GroupManager {
  constructor(storageManager) {
    this.storageManager = storageManager;
    this.currentGroup = null;
    this.groups = {};
  }

  async loadGroups() {
    try {
      const res = await fetch("/api/groups");
      if (res.ok) {
        this.groups = await res.json();
        console.log("✅ Группы загружены:", this.groups);
      } else {
        this.groups = {};
      }
      return this.groups;
    } catch (e) {
      console.error("Ошибка загрузки групп:", e);
      this.groups = {};
      return this.groups;
    }
  }

  async createGroup(name, password, creatorLogin) {
    const groupId = "group_" + Date.now();
    const groupData = {
      id: groupId,
      name: name,
      password: password,
      createdAt: new Date().toISOString(),
      createdBy: creatorLogin,
      members: [creatorLogin],
      players: {},
      gameSettings: {},
      arcade: {},
    };

    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(groupData),
    });

    if (res.ok) {
      this.groups[groupId] = groupData;
      this.currentGroup = groupId;
      return groupData;
    }
    return null;
  }

  async joinGroup(groupId, password, userLogin) {
    const group = this.groups[groupId];
    if (!group) return { success: false, error: "Группа не найдена" };
    if (group.password !== password)
      return { success: false, error: "Неверный пароль" };
    if (group.members.includes(userLogin)) {
      return { success: false, error: "Вы уже в этой группе" };
    }

    // При вступлении переносим аркадные рекорды пользователя в группу
    const userArcade = this.storageManager.getArcadeData();
    if (userArcade) {
      // Переносим аркадные рекорды пользователя в группу
      for (const gameId in userArcade) {
        const records = userArcade[gameId]?.records || [];
        const userRecord = records.find((r) => r.player === userLogin);
        if (userRecord) {
          if (!group.arcade) group.arcade = {};
          if (!group.arcade[gameId]) {
            group.arcade[gameId] = { records: [], gamesPlayed: 0 };
          }
          // Добавляем или обновляем запись
          const existing = group.arcade[gameId].records.find(
            (r) => r.player === userLogin
          );
          if (existing) {
            existing.totalScore = userRecord.totalScore;
            existing.gamesPlayed = userRecord.gamesPlayed;
            existing.bestScore = userRecord.bestScore;
            existing.winRate = userRecord.winRate;
          } else {
            group.arcade[gameId].records.push({ ...userRecord });
          }
        }
      }
    }

    group.members.push(userLogin);

    const res = await fetch("/api/groups", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId, group }),
    });

    if (res.ok) {
      this.currentGroup = groupId;
      return { success: true };
    }
    return { success: false, error: "Ошибка сохранения" };
  }

  async leaveGroup(groupId, userLogin) {
    const group = this.groups[groupId];
    if (!group) return false;

    if (group.members.length === 1 && group.members[0] === userLogin) {
      return await this.deleteGroup(groupId);
    }

    group.members = group.members.filter((m) => m !== userLogin);

    const res = await fetch("/api/groups", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId, group }),
    });

    if (res.ok) {
      this.currentGroup = null;
      return true;
    }
    return false;
  }

  async deleteGroup(groupId) {
    const res = await fetch(`/api/groups/${groupId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      delete this.groups[groupId];
      this.currentGroup = null;
      return true;
    }
    return false;
  }

  async updateGroup(groupId, groupData) {
    const res = await fetch("/api/groups", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId, group: groupData }),
    });

    if (res.ok) {
      this.groups[groupId] = groupData;
      return true;
    }
    return false;
  }

  getUserGroup(userLogin) {
    for (const id in this.groups) {
      const group = this.groups[id];
      if (group.members && group.members.includes(userLogin)) {
        return id;
      }
    }
    return null;
  }

  isUserInGroup(userLogin) {
    return this.getUserGroup(userLogin) !== null;
  }

  getGroupData(groupId) {
    return this.groups[groupId] || null;
  }

  getGroupMembers(groupId) {
    const group = this.groups[groupId];
    if (!group) return [];
    return group.members || [];
  }

  getGroupName(groupId) {
    const group = this.groups[groupId];
    return group ? group.name : null;
  }

  isGroupMember(groupId, userLogin) {
    const group = this.groups[groupId];
    if (!group) return false;
    return group.members.includes(userLogin);
  }

  isGroupAdmin(groupId, userLogin) {
    const group = this.groups[groupId];
    if (!group) return false;
    return group.createdBy === userLogin;
  }

  getAvailableGroups() {
    const result = [];
    for (const id in this.groups) {
      result.push({
        id: id,
        name: this.groups[id].name,
        members: this.groups[id].members.length,
        createdBy: this.groups[id].createdBy,
      });
    }
    return result;
  }

  // ===== МЕТОДЫ ДЛЯ РАБОТЫ СО СТАТИСТИКОЙ В ГРУППЕ =====

  getGroupPlayers(groupId) {
    const group = this.groups[groupId];
    if (!group) return {};
    return group.players || {};
  }

  getGroupStats(groupId) {
    const group = this.groups[groupId];
    if (!group) return [];

    const stats = [];
    const players = group.players || {};

    for (const name in players) {
      const playerData = players[name];
      let totalWins = 0;
      let totalLosses = 0;

      if (playerData.games) {
        for (const game in playerData.games) {
          totalWins += playerData.games[game].wins || 0;
          totalLosses += playerData.games[game].losses || 0;
        }
      }

      const total = totalWins + totalLosses;
      stats.push({
        name: name,
        wins: totalWins,
        losses: totalLosses,
        total: total,
        winRate:
          total === 0 ? 0 : Number(((totalWins / total) * 100).toFixed(1)),
      });
    }

    return stats;
  }

  getGroupGameSettings(groupId) {
    const group = this.groups[groupId];
    if (!group) return {};
    return group.gameSettings || {};
  }

  getGroupGameSetting(groupId, game) {
    const settings = this.getGroupGameSettings(groupId);
    return settings[game] || "both";
  }

  getGroupAvailableGames(groupId) {
    const group = this.groups[groupId];
    if (!group) return ["all"];

    const games = new Set();
    const players = group.players || {};

    for (const name in players) {
      if (players[name].games) {
        for (const game in players[name].games) {
          games.add(game);
        }
      }
    }

    return ["all", ...Array.from(games)];
  }

  getGroupPlayerStats(groupId, playerName) {
    const group = this.groups[groupId];
    if (!group) return null;

    const player = group.players?.[playerName];
    if (!player) return null;

    let totalWins = 0;
    let totalLosses = 0;
    const games = {};

    if (player.games) {
      for (const game in player.games) {
        games[game] = { ...player.games[game] };
        totalWins += player.games[game].wins || 0;
        totalLosses += player.games[game].losses || 0;
      }
    }

    const total = totalWins + totalLosses;
    return {
      name: playerName,
      games: games,
      totalWins: totalWins,
      totalLosses: totalLosses,
      total: total,
      winRate: total === 0 ? 0 : Number(((totalWins / total) * 100).toFixed(1)),
    };
  }

  getGroupPlayerNames(groupId) {
    const group = this.groups[groupId];
    if (!group) return [];
    return Object.keys(group.players || {});
  }

  // ===== АРКАДЫ В ГРУППЕ =====
  getGroupArcadeData(groupId) {
    const group = this.groups[groupId];
    if (!group) return {};
    return group.arcade || {};
  }

  getGroupArcadeLeaderboard(groupId, gameId) {
    const arcade = this.getGroupArcadeData(groupId);
    if (!arcade[gameId]) {
      return [];
    }
    return arcade[gameId].records || [];
  }

  async saveGroupArcadeScore(groupId, gameId, score, player) {
    const group = this.groups[groupId];
    if (!group) return false;

    if (!group.arcade) group.arcade = {};
    if (!group.arcade[gameId]) {
      group.arcade[gameId] = { records: [], gamesPlayed: 0 };
    }

    const existingIndex = group.arcade[gameId].records.findIndex(
      (r) => r.player === player
    );

    if (existingIndex !== -1) {
      const record = group.arcade[gameId].records[existingIndex];
      record.totalScore = (record.totalScore || 0) + score;
      record.gamesPlayed = (record.gamesPlayed || 0) + 1;
      record.bestScore = Math.max(record.bestScore || 0, score);
      record.lastScore = score;
      record.date = new Date().toISOString().slice(0, 10);
      record.winRate =
        Math.round((record.totalScore / record.gamesPlayed) * 10) / 10;
      group.arcade[gameId].records[existingIndex] = record;
    } else {
      group.arcade[gameId].records.push({
        player: player,
        totalScore: score,
        bestScore: score,
        lastScore: score,
        gamesPlayed: 1,
        winRate: score,
        date: new Date().toISOString().slice(0, 10),
      });
    }

    group.arcade[gameId].records.sort((a, b) => b.totalScore - a.totalScore);
    group.arcade[gameId].records = group.arcade[gameId].records.slice(0, 20);
    group.arcade[gameId].gamesPlayed =
      (group.arcade[gameId].gamesPlayed || 0) + 1;

    await this.updateGroup(groupId, group);
    return true;
  }
}
