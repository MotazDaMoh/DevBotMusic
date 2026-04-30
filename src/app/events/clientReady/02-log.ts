import type { Client } from 'discord.js';

export default function onReady(client: Client<true>): void {
  console.log(
    `[bot] logged in as ${client.user.tag} (${client.user.id}) — serving ${client.guilds.cache.size} guild(s)`,
  );
}
