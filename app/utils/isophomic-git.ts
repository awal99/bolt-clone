export const gitSetupScript = () => {
    const code = `
        import git from 'isomorphic-git';
        import http from 'isomorphic-git/http/web/index.cjs';
        import fs from 'fs';
        import dotenv from 'dotenv';
        // Load environment variables from .env file
        dotenv.config();

        const dir = '.';

        async function gitSetup() {
        try {
            // Initialize git repo
            await git.init({ fs, dir });

            // Add all files
            await git.add({ fs, dir, filepath: '.' });

            // Commit changes
            await git.commit({
            fs,
            dir,
            message: 'Initial commit',
            author: {
                name: process.env.AUTHOR_NAME,
                email: process.env.AUTHOR_EMAIL
            }
            });

             // List all branches
            const branches = await git.listBranches({ fs, dir });

            // Check if the branch exists
            if (branches.includes('main')) {
                await git.checkout({ fs, dir, ref: 'main' });
            } else {
                 // Checkout to main branch
                await git.branch({ fs, dir, ref: 'main' });
                await git.checkout({ fs, dir, ref: 'main' });

            }

           
            // Push changes to GitHub
            const { GITHUB_TOKEN, GITHUB_USERNAME, GITHUB_REPO, AUTHOR_EMAIL } = process.env;

            if (!GITHUB_TOKEN || !GITHUB_USERNAME || !GITHUB_REPO) {
            throw new Error('GitHub credentials not found in .env file');
            }

             // Set global configuration for the author
            await git.setConfig({ fs, dir, path: 'user.name', value: GITHUB_USERNAME });
            await git.setConfig({ fs, dir, path: 'user.email', value: AUTHOR_EMAIL });

            await git.addRemote({
                fs,
                dir,
                remote: 'origin', // Name of the remote
                url: 'https://github.com/'+GITHUB_USERNAME+'/'+GITHUB_REPO+'.git', // URL of the remote
            });

            await git.push({
            fs,
            http,
            dir,
            remote: 'origin',
            ref: 'main',
            onAuth: () => ({ username: GITHUB_TOKEN }),
            url: 'https://github.com/'+GITHUB_USERNAME+'/'+GITHUB_REPO+'.git'
            });

            console.log('Git setup completed successfully!');
        } catch (error) {
            console.error('Error during git setup:', error);
        }
        }

        gitSetup();`.replace(/`/g, '\\`');
   
    return code;
}