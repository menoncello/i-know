import { connectDatabase } from '../src/index.js';

/**
 *
 */
async function seedDatabase() {
  try {
    const db = connectDatabase({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: Number.parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'i_know_development',
      user: process.env.POSTGRES_USER || 'username',
      password: process.env.POSTGRES_PASSWORD || 'password',
      ssl: false,
    });

    console.log('🌱 Seeding database with sample data...');

    // Insert sample actors
    const actors = await db`
      INSERT INTO actors (name, imdb_id, biography) VALUES
      ('Tom Hanks', 'nm0000158', 'Thomas Jeffrey Hanks is an American actor and filmmaker.'),
      ('Meryl Streep', 'nm0000658', 'Mary Louise Streep is an American actress.'),
      ('Leonardo DiCaprio', 'nm0000138', 'Leonardo Wilhelm DiCaprio is an American actor and film producer.'),
      ('Jennifer Lawrence', 'nm2225369', 'Jennifer Shrader Lawrence is an American actress.'),
      ('Robert De Niro', 'nm0000134', 'Robert Anthony De Niro is an American actor and film producer.')
      ON CONFLICT (imdb_id) DO NOTHING
      RETURNING id, name;
    `;

    console.log(`✅ Inserted ${actors.length} actors`);

    // Insert sample content
    const content = await db`
      INSERT INTO content (type, title, year, imdb_id, synopsis) VALUES
      ('movie', 'Forrest Gump', 1994, 'tt0109830', 'The presidencies of Kennedy and Johnson, the Vietnam War, and the Watergate scandal unfold from the perspective of an Alabama man with an IQ of 75.'),
      ('movie', 'The Devil Wears Prada', 2006, 'tt0458352', 'A smart but sensible new graduate lands a job as an assistant to Miranda Priestly, the demanding editor-in-chief of a high fashion magazine.'),
      ('movie', 'Inception', 2010, 'tt1375666', 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.'),
      ('movie', 'The Hunger Games', 2012, 'tt1392170', 'Katniss Everdeen voluntarily takes her younger sister''s place in the Hunger Games: a televised competition in which two teenagers from each of the twelve Districts of Panem are chosen at random to fight to the death.'),
      ('movie', 'Silver Linings Playbook', 2012, 'tt1045658', 'After a stint in a mental institution, former teacher Pat Solitano moves back in with his parents and tries to reconcile with his ex-wife.')
      ON CONFLICT (imdb_id) DO NOTHING
      RETURNING id, title;
    `;

    console.log(`✅ Inserted ${content.length} movies`);

    // Create actor-content relationships
    const actorContentRelations = await db`
      INSERT INTO actor_content (actor_id, content_id)
      SELECT a.id, c.id
      FROM actors a, content c
      WHERE
        (a.name = 'Tom Hanks' AND c.title = 'Forrest Gump') OR
        (a.name = 'Meryl Streep' AND c.title = 'The Devil Wears Prada') OR
        (a.name = 'Leonardo DiCaprio' AND c.title = 'Inception') OR
        (a.name = 'Jennifer Lawrence' AND c.title = 'The Hunger Games') OR
        (a.name = 'Jennifer Lawrence' AND c.title = 'Silver Linings Playbook') OR
        (a.name = 'Robert De Niro' AND c.title = 'Silver Linings Playbook')
      ON CONFLICT (actor_id, content_id) DO NOTHING;
    `;

    console.log(`✅ Created ${actorContentRelations.count} actor-content relationships`);

    // Insert sample user
    const users = await db`
      INSERT INTO users (email, preferences) VALUES
      ('demo@iknow.com', '{"favoriteActors": ["nm0000158", "nm0000138"], "notifications": true, "watchlist": []}')
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email;
    `;

    console.log(`✅ Inserted ${users.length} sample users`);
    console.log('🎉 Database seeding completed successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

if (import.meta.main) {
  seedDatabase();
}
