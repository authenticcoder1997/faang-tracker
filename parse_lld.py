import re
import html

with open("/Users/paragkaundil/.gemini/antigravity/brain/1a47a67c-e7ac-4cce-8235-c7a9df4cd5c2/.system_generated/steps/148/content.md", "r") as f:
    text = f.read()

matches = re.findall(r'href="(/learn/lld/[^"]*)"[^>]*>([^<]*)<', text)

output = "export const lldTopics = [\n"
for i, match in enumerate(matches):
    url = f"https://algomaster.io{match[0]}"
    title = html.unescape(match[1])
    clean_title = title.replace("'", "\\'")
    # Use generic categories based on where they appear
    if i < 9:
        diff = "OOP Basics"
    elif i < 18:
        diff = "SOLID"
    elif i < 42:
        diff = "Patterns"
    else:
        diff = "Problems"
        
    output += f"  {{ id: 'lld-{i+1}', title: '{clean_title}', difficulty: '{diff}', url: '{url}' }},\n"
output += "];\n"

with open("src/data/lldTopics.js", "w") as f:
    f.write(output)

print("Updated lldTopics.js with", len(matches), "topics.")
