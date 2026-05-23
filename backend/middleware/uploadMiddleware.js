import multer from 'multer';
import path from 'path';

// Configuração de armazenamento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Pasta onde as imagens serão salvas
  },
  filename: function (req, file, cb) {
    // Define um nome único para o arquivo para evitar sobreposição
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// Filtro de arquivo para aceitar apenas imagens
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('Apenas arquivos de imagem são permitidos!'), false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

export default upload;