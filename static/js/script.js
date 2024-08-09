function fireEffect(attackerId, power) {
    const attacker = document.getElementById(attackerId);
    const fire = document.createElement('div');
    fire.className = attackerId === 'player-tank' ? 'fire-effect' : 'fire-effect-enemy';
    fire.style.width = fire.style.height = Math.max(power / 10, 10) + 'px';  // 调整火焰大小，最小为10px
    fire.style.left = attackerId === 'player-tank' ? '100px' : '500px'; // 子弹从坦克炮口出发
    fire.style.top = '200px'; // 调整火焰位置
    attacker.appendChild(fire);

    // 修改动画方向
    fire.style.animation = attackerId === 'player-tank' ? 'fire-animation 1s ease-out forwards' : 'fire-animation-reverse 1s ease-out forwards';

    setTimeout(() => {
        attacker.removeChild(fire);
    }, 1000);  // 火焰动画持续时间
}

function syncInputs(rangeId, textId) {
    const rangeInput = document.getElementById(rangeId);
    const textInput = document.getElementById(textId);

    rangeInput.addEventListener('input', function() {
        textInput.value = rangeInput.value;
    });

    textInput.addEventListener('input', function() {
        rangeInput.value = textInput.value;
    });
}

let healthChart;

function updateHealthChart(playerHp, npcHp) {
    console.log('Updating chart with values:', playerHp, npcHp);

    // 添加新的数据点到图表
    healthChart.data.labels.push(healthChart.data.labels.length + 1);
    healthChart.data.datasets[0].data.push(playerHp);
    healthChart.data.datasets[1].data.push(npcHp);

    // 使用 requestAnimationFrame 强制更新图表
    requestAnimationFrame(() => {
        healthChart.update();  // 调用update确保图表刷新
    });
}

document.getElementById('start-battle').addEventListener('click', function() {
    // 清空之前的战斗日志和图表数据
    const battleLog = document.getElementById('battle-log');
    battleLog.innerHTML = '';

    // 重新初始化图表
    if (healthChart) {
        healthChart.destroy();  // 销毁之前的图表实例
    }

    const playerHp = parseInt(document.getElementById('player-hp').value);
    const npcHp = parseInt(document.getElementById('npc-hp').value);
    initHealthChart(playerHp, npcHp);  // 重新初始化图表
    updateHealthChart(playerHp, npcHp);

    const selectedWeapon = document.querySelector('input[name="weapon"]:checked').value;
    const playerAttack = parseInt(document.getElementById('player-attack').value);
    const npcAttack = parseInt(document.getElementById('npc-attack').value);

    const url = `/battle?player_hp=${playerHp}&player_attack=${playerAttack}&npc_hp=${npcHp}&npc_attack=${npcAttack}&weapon=${selectedWeapon}`;

    const eventSource = new EventSource(url);

    eventSource.onmessage = function(event) {
        const data = JSON.parse(event.data);
        
        data.battle_log.forEach(log => {
            const logEntry = document.createElement('p');
            logEntry.textContent = log;
            battleLog.appendChild(logEntry);
        });

        const playerRemainingHp = Math.max(0, data.battle_effects[0].player_remaining_hp);
        const npcRemainingHp = Math.max(0, data.battle_effects[0].npc_remaining_hp);

        // 更新血量曲线图
        updateHealthChart(playerRemainingHp, npcRemainingHp);

        // 子弹发射效果同步更新
        if (data.battle_log[0].includes("玩家攻击")) {
            fireEffect('player-tank', data.battle_effects[0].player_damage);
        } else if (data.battle_log[0].includes("NPC攻击")) {
            fireEffect('npc-tank', data.battle_effects[0].npc_damage);
        }

        if (data.battle_log[0].includes("获胜")) {
            // 使用 requestAnimationFrame 或 setTimeout 确保图表更新后再显示 alert
            requestAnimationFrame(() => {
                setTimeout(() => {
                    alert(data.battle_log[0]);
                    eventSource.close();
                }, 100); // 确保渲染完成后再弹出提示
            });
        }
    };

    eventSource.onerror = function() {
        eventSource.close();
    };
});

function initHealthChart(playerInitialHp, npcInitialHp) {
    const ctx = document.getElementById('health-chart').getContext('2d');
    healthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['1'],  // 初始化时第一回合
            datasets: [
                {
                    label: '玩家HP',
                    borderColor: 'rgb(75, 192, 192)',
                    data: [playerInitialHp],  // 玩家初始HP
                    fill: false
                },
                {
                    label: 'NPC HP',
                    borderColor: 'rgb(192, 75, 75)',
                    data: [npcInitialHp],  // NPC初始HP
                    fill: false
                }
            ]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '回合'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'HP'
                    },
                    min: 0,
                    max: Math.max(playerInitialHp, npcInitialHp)
                }
            }
        }
    });

    // 立即更新图表以显示初始数据
    healthChart.update();
}

syncInputs('player-hp', 'player-hp-text');
syncInputs('player-attack', 'player-attack-text');
syncInputs('npc-hp', 'npc-hp-text');
syncInputs('npc-attack', 'npc-attack-text');
