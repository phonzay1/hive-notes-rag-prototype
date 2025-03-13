import { getHiveNotes } from './rag';

async function main() {
  const questions = [
    "What date did I remove the Hive Hugger from hive C7?",
    "What hives had eggs, larvae, and pupae (ELP) in May?",
    "Did I add supers to any colonies in May?"
  ];

  for (const question of questions) {
    console.log('\nQuestion:', question);
    const answer = await getHiveNotes(question);
    console.log('Answer:', answer);
    console.log('-'.repeat(80));
  }
}

main().catch(console.error);