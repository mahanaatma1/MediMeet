#!/usr/bin/env bash
# exit on error
set -o errexit

npm install
npm run build

# Copy the redirect files to the dist folder
cp ./public/_redirects ./dist/
cp ./netlify.toml ./dist/

# Create a web server configuration file
echo '/* /index.html 200' > ./dist/_redirects

# Create a Render-specific routing file
cat > ./dist/render-routes.json << EOL
{
  "routes": [
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
EOL 