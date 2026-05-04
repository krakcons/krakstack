for file in components/ui/*.tsx; do npx shadcn-ui@latest add -y -o $(basename "$file" .tsx); done
