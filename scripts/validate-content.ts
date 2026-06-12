import {
  ContentValidationError,
  loadContentRepository,
} from "../src/lib/content/repository";

try {
  const repository = loadContentRepository();
  const count = Object.values(repository.resources).flat().length;
  console.log(
    `Content valid: ${count} resources, ${repository.faqs.length} FAQs, ${repository.redirects.length} redirects.`,
  );
} catch (error) {
  if (error instanceof ContentValidationError) {
    console.error(error.message);
  } else {
    console.error(error);
  }
  process.exitCode = 1;
}
