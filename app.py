from flask import Flask, render_template, request, Response
import random
import time
import json

app = Flask(__name__)

# 设置初始的游戏数据
game_data = {
    'player_hp': 3000,
    'player_attack': 100,
    'npc_hp': 3000,
    'npc_attack': 500
}

def simulate_attack(attack_power, weapon_choice):
    """根据武器选择计算攻击力"""
    if weapon_choice == 'A':
        return attack_power + 500
    elif weapon_choice == 'B':
        return attack_power + random.randint(0, 1000)
    return attack_power

def generate(player_hp, player_attack, npc_hp, npc_attack, weapon_choice):
    battle_log = []
    battle_effects = []

    while player_hp > 0 and npc_hp > 0:
        # 玩家攻击NPC
        player_damage = simulate_attack(player_attack, weapon_choice)
        npc_hp -= player_damage
        battle_log.append(f"玩家攻击造成 {player_damage} 点伤害，NPC剩余HP: {npc_hp}")
        battle_effects.append({
            'player_damage': player_damage,
            'npc_damage': 0,
            'player_remaining_hp': player_hp,
            'npc_remaining_hp': npc_hp
        })

        yield f"data: {json.dumps({'battle_log': battle_log[-1:], 'battle_effects': battle_effects[-1:]})}\n\n"

        # 检查NPC是否被击败
        if npc_hp <= 0:
            battle_log.append("NPC被击败！玩家获胜！")
            yield f"data: {json.dumps({'battle_log': ['NPC被击败！玩家获胜！'], 'battle_effects': battle_effects[-1:]})}\n\n"
            break

        # NPC攻击玩家
        npc_damage = npc_attack
        player_hp -= npc_damage
        battle_log.append(f"NPC攻击造成 {npc_damage} 点伤害，玩家剩余HP: {player_hp}")
        battle_effects[-1]['npc_damage'] = npc_damage
        battle_effects[-1]['player_remaining_hp'] = player_hp
        battle_effects[-1]['npc_remaining_hp'] = npc_hp

        yield f"data: {json.dumps({'battle_log': battle_log[-1:], 'battle_effects': battle_effects[-1:]})}\n\n"

        # 检查玩家是否被击败
        if player_hp <= 0:
            battle_log.append("玩家被击败！NPC获胜！")
            yield f"data: {json.dumps({'battle_log': ['玩家被击败！NPC获胜！'], 'battle_effects': battle_effects[-1:]})}\n\n"
            break

        time.sleep(1)  # 模拟每回合之间的延迟

@app.route('/')
def index():
    return render_template('index.html', game_data=game_data)

@app.route('/battle', methods=['GET'])
def battle():
    player_hp = int(request.args.get('player_hp'))
    player_attack = int(request.args.get('player_attack'))
    npc_hp = int(request.args.get('npc_hp'))
    npc_attack = int(request.args.get('npc_attack'))
    weapon_choice = request.args.get('weapon')

    return Response(generate(player_hp, player_attack, npc_hp, npc_attack, weapon_choice), mimetype='text/event-stream')

if __name__ == '__main__':
    app.run(debug=True, threaded=True)
