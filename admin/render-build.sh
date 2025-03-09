#!/usr/bin/env bash
# exit on error
set -o errexit

npm install
npm run build

# Create all the necessary files for SPA routing
echo '/* /index.html 200' > ./dist/_redirects
cp ./public/404.html ./dist/
cp ./netlify.toml ./dist/

# Create a Render-specific routing file
cat > ./dist/render-routes.json << EOL
{
  "routes": [
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
EOL

# Create a special file for Render that will be used for all routes
cat > ./dist/200.html << EOL
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0;url=/">
</head>
<body>
  Redirecting...
</body>
</html>
EOL

# Copy index.html to 404.html for Render
cp ./dist/index.html ./dist/404.html 